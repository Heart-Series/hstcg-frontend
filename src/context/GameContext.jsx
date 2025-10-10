import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { canDrop } from '../utils/dropValidation';
import toast from 'react-hot-toast';
import { useGameEngine } from '../hooks/useGameEngine';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children, initialGameState, isSpectator }) => {
  // === PART 1: All UI State Hooks ===
  const [targeting, setTargeting] = useState({ isTargeting: false, action: null });
  const [isHandOpen, setIsHandOpen] = useState(false);
  const [inspectorCardData, setInspectorCardData] = useState(null);
  const [viewingCardPile, setViewingCardPile] = useState(null);
  const [resolutionState, setResolutionState] = useState({ isActive: false, actions: [] });
  const [animation, setAnimation] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);

  // === PART 2: All UI Callback Functions ===
  const showToast = useCallback((message, options = {}) => {
    const renderToast = (t) => (
      <span onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
        {message}
      </span>
    );
    switch (options.style) {
      case 'success': toast.success(renderToast); break;
      case 'error': toast.error(renderToast); break;
      default: toast(renderToast, { icon: 'ℹ️' }); break;
    }
  }, []);

  const showAnimation = useCallback((animationData) => setAnimation(animationData), []);
  const hideAnimation = useCallback(() => setAnimation(null), []);
  const openCardPileViewer = useCallback((title, cards) => setViewingCardPile({ title, cards }), []);
  
  const openInspector = useCallback((cardData) => setInspectorCardData(cardData), []);
  const cancelAllActions = useCallback(() => {
    setSelectedCardId(null);
    setTargeting({ isTargeting: false, action: null });
  }, []);
  const closeInspector = useCallback(() => setInspectorCardData(null), []);

  // === PART 3: The Game Engine Hook ===
  const gameEngineData = useGameEngine(initialGameState, isSpectator, {
    showToast, setResolutionState, openCardPileViewer, showAnimation,
  });
  const { actions, myPlayerState, opponentState, promptChoice, gameState } = gameEngineData;

  const closeCardPileViewer = useCallback(() => {
    setViewingCardPile(null);
    // If there's a prompt with no valid choices (view-only prompt), clear it
    if (promptChoice && (!promptChoice.validChoices || promptChoice.validChoices.length === 0)) {
      actions.clearPrompt();
    }
  }, [promptChoice, actions]);

  // === PART 4: The Complex Event Handlers (The "Bridge") ===
  const handleDragStart = useCallback((event) => {
    setActiveDragId(event.active.id);
    setActiveDragData(event.active.data.current);
    setIsHandOpen(false);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveDragId(null);
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    const draggedCard = active.data.current?.cardData;
    const instanceId = draggedCard?.instanceId;
    if (!instanceId) return;

    const dropZoneId = over.id;

    if (draggedCard?.initiatesUI === 'inspector') {
      const parts = dropZoneId.split('-');
      const player = parts[0] === 'my' ? myPlayerState : opponentState;
      const targetCard = parts[1] === 'active' ? player.activeCard : player.bench[parseInt(parts[2])];
      if (targetCard) openInspector(targetCard);
      return;
    }
  if (draggedCard?.cardType === 'Item') {
      const parts = dropZoneId.split('-');
      const target = {
        playerId: parts[0] === 'my' ? myPlayerState.socketId : opponentState.socketId,
        zone: parts[1],
        index: parts[2] !== undefined ? parseInt(parts[2]) : null,
      };

      // Validate the drop using shared logic
      const ownerPlayerState = parts[0] === 'my' ? myPlayerState : opponentState;
      const playerPrefix = parts[0]; // 'my' or 'opponent'
      const isAllowed = canDrop({ draggedCard, zone: parts[1], ownerPlayerState, playerPrefix, gameState, index: target.index });
      if (!isAllowed) {
        console.debug('Rejected drop (client):', { draggedCard, dropZoneId, parts, isAllowed, ownerPlayerState });
        showToast('Invalid drop: that item cannot be used there.', { style: 'error' });
        return; // Reject the drop client-side
      }

      // Defensive extra checks: ensure slot actually exists for attachments
      if (parts[1] === 'bench') {
        if (!ownerPlayerState || !Array.isArray(ownerPlayerState.bench) || !ownerPlayerState.bench[target.index]) {
          return; // bench slot empty - reject
        }
      }
      if (parts[1] === 'active') {
        if (!ownerPlayerState || !ownerPlayerState.activeCard) {
          return; // active slot empty - reject
        }
      }

  console.debug('Sending playItemCard to server', { instanceId, target });
  // Close any open action menus / targeting state before emitting the action
  cancelAllActions();
  closeInspector();
  actions.playItemCard(instanceId, target);
      return;
    }
    if (gameState.phase === 'setup' && dropZoneId === 'my-active') {
      actions.setInitialActive(instanceId);
      return;
    }
    if (gameState.phase === 'main_phase') {
      if (dropZoneId === 'my-active' && !myPlayerState.activeCard) actions.playCardToActive(instanceId);
      else if (dropZoneId.startsWith('my-bench-')) actions.playCardToBench(instanceId, parseInt(dropZoneId.split('-')[2]));
      else if (dropZoneId === 'my-support') actions.playSupportCard(instanceId);
    }
  }, [actions, gameState, myPlayerState, opponentState, openInspector]);

  const onCardClick = useCallback((clickedCard, isTargetable) => {
    if (!actions) return;
    const clickedInstanceId = clickedCard.instanceId;
    if (clickedInstanceId === selectedCardId) {
      cancelAllActions();
      return;
    }
    if (targeting.isTargeting && isTargetable) {
      const action = targeting.action;

      // --- REVISED LOGIC ---
      // If this is a resolution-phase action (it will include sourceCardId),
      // always handle it first so resolution basic attacks aren't treated as normal attacks.
      if (action.sourceCardId) {
        actions.performResolutionAction(action, clickedInstanceId);
      } else if (action.isMultiPhase) {
        // It's a multi-phase attack that was waiting for a target. Start phase 1.
        actions.resolveAbilityStep(selectedCardId, clickedInstanceId, 1, null);
      } else if (action.type === 'retreat') {
        const benchIndex = myPlayerState.bench.findIndex(c => c && c.instanceId === clickedInstanceId);
        if (benchIndex > -1) actions.retreatActiveCard(benchIndex);
      } else if (action.type === 'basic_attack' || action.type === 'special_attack') {
        // It's a regular, single-phase attack.
        actions.performAttack(action.type, clickedInstanceId);
      }
      // Handle prompt choices like before
      else if (promptChoice) {
        if (promptChoice.choosingState?.sourceInstanceId) {
          actions.resolveAbilityStep(promptChoice.choosingState.sourceInstanceId, clickedInstanceId, promptChoice.phase, promptChoice.choosingState);
        } else {
          actions.playItemCard(null, clickedInstanceId, promptChoice.phase, promptChoice.choosingState);
        }
      }

      cancelAllActions();
      return;
    }
    setSelectedCardId(clickedInstanceId);
  }, [actions, selectedCardId, targeting, promptChoice, myPlayerState, cancelAllActions]);

  const onActionClick = useCallback((action, sourceCardData) => {
    if (!actions) return;
    if (action.type === 'view') {
      openInspector(sourceCardData);
      setSelectedCardId(null);
      return;
    }
    if (resolutionState.isActive && action.sourceCardId) {
      setTargeting({ isTargeting: true, action: action, validTargets: action.validTargets || [] });
      return;
    }
    if (action.requiresTarget) {
      setTargeting({ isTargeting: true, action: action });
    } else {
      if (action.type === 'activate') {
        actions.activateBenchCard(action.payload?.benchIndex);
      }
      cancelAllActions();
    }
  }, [actions, resolutionState, opponentState, cancelAllActions, openInspector]);

  const promptMessage = useMemo(() => {
   // 1. If we are actively targeting something, that's the most important message.
    if (targeting.isTargeting && targeting.action?.title) {
        return targeting.action.title;
    }
    
    // 2. If the server sent a specific prompt (like for Satonix), show that.
    if (promptChoice?.title) {
        return promptChoice.title;
    }

    // 3. As a fallback, if we're in the resolution phase but not targeting yet, show the general message.
    if (resolutionState.isActive) {
        return "End-of-Turn Actions";
    }

    return null; // Otherwise, show nothing.
  }, [resolutionState.isActive, targeting, promptChoice]);


  // === PART 5: The Final Value Object ===
  const value = {
    ...gameEngineData,
    targeting, setTargeting,
    isHandOpen, setIsHandOpen,
    inspectorCardData, openInspector, closeInspector,
    viewingCardPile, openCardPileViewer, closeCardPileViewer,
    resolutionState,
    animation, showAnimation, hideAnimation,
    activeDragId,
    activeDragData,
    selectedCardId,
    // expose setters and utilities that existed on GameUIContext
    setSelectedCardId,
    setActiveDragId,
    setActiveDragData,
    showToast,
    setResolutionState,
    onCardClick,
    onActionClick,
    cancelAllActions,
    handleDragStart,
    handleDragEnd,
    promptMessage
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};