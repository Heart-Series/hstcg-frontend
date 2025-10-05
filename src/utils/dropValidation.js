// src/utils/dropValidation.js
// Centralized logic to decide whether a dragged card can be dropped on a slot.

/**
 * Decide if a dragged card may be dropped on the given slot.
 * @param {object} params
 * @param {object} params.draggedCard - the card object being dragged
 * @param {string} params.zone - 'bench' | 'active' | 'support'
 * @param {object} params.ownerPlayerState - the player state of the slot owner
 * @param {string} params.playerPrefix - 'my' or 'opponent' as used in validTargets
 * @param {object} params.gameState - current game state
 * @param {number|null} params.index - bench index when zone==='bench'
 */
export function canDrop({ draggedCard, zone, ownerPlayerState, playerPrefix, gameState, index = null }) {
    if (!draggedCard) return false;

    // Helper to check target strings on items
    const targetString = (suffix) => `${playerPrefix}_${suffix}`; // e.g., 'my_bench'

    // Helper: does the card's validTargets allow THIS slot by either
    // - providing an instanceId that matches the host card's instanceId, OR
    // - providing a declarative string like 'my_bench' / 'opponent_active'.
    const validTargetsAllows = (hostInstanceId, declarative) => {
        const vt = draggedCard.validTargets;
        if (!Array.isArray(vt)) return false;
        // If an instanceId list is present, prefer it
        if (hostInstanceId && vt.includes(hostInstanceId)) return true;
        // Fallback: check the declarative string
        return vt.includes(declarative);
    }

    // BENCH SLOT
    if (zone === 'bench') {
        const slotOccupied = !!ownerPlayerState?.bench?.[index];
        // If dragging an Item, bench slot must be occupied by a host card and item must allow bench
        if (draggedCard.cardType === 'Item') {
            if (!slotOccupied) return false;
            const host = ownerPlayerState.bench[index];
            const hostId = host?.instanceId || null;
            return validTargetsAllows(hostId, targetString('bench'));
        }
        // If dragging a Player card, bench slot must be empty, game must not be in a setup phase, and it should be your own bench 
        if (draggedCard.cardType === 'Player') {
            return !slotOccupied && gameState?.phase !== 'setup' && playerPrefix === 'my';
        }
        return false;
    }

    // ACTIVE SLOT
    if (zone === 'active') {
        const activeCard = ownerPlayerState?.activeCard || null;
        if (draggedCard.cardType === 'Item') {
            if (!activeCard) return false;
            const hostId = activeCard.instanceId;
            return validTargetsAllows(hostId, targetString('active'));
        }
        if (draggedCard.cardType === 'Player') {
            // Allow play to active during setup OR when it's the player's main phase and their active is empty. Do not allow to place on opponent active. 
            return (gameState?.phase === 'setup' || (gameState?.phase === 'main_phase' && gameState?.activePlayerId === ownerPlayerState?.socketId && !ownerPlayerState?.activeCard)) && playerPrefix === 'my';
        }
        return false;
    }

    // SUPPORT SLOT
    if (zone === 'support') {
        if (!draggedCard) return false;
        // Only Base or Team can be played to support during main phase
        return gameState?.phase === 'main_phase' && (draggedCard.cardType === 'Base' || draggedCard.cardType === 'Team');
    }

    return false;

}
