// src/components/game/CardOnField.jsx
import React from 'react';
import Card from '../Card';
import { useGame } from '../../context/GameContext';

const CardOnField = ({ cardData, isSelected, isTargetable, onCardClick, onActionClick, showTuckedAttachments = true }) => {

  return (
    <div
      // The onClick handler is added to the same div
      onClick={(e) => {
        e.stopPropagation()
        onCardClick(cardData, isTargetable)
      }}
      className={`w-full h-full rounded-lg transition-all duration-150 relative cursor-pointer
                
              ${isTargetable ? 'ring-4 ring-yellow-400 animate-pulse' : ''} 
              ${isSelected ? 'ring-4 ring-blue-500' : ''}
          `}

    // ${cardData.isCancelled ? 'grayscale opacity-70' : ''}

    >
      <div className="relative z-10 w-full h-full">
        <Card cardData={cardData} />
      </div>

      {showTuckedAttachments && cardData.attachedItems && cardData.attachedItems.length > 0 && (
        <div className="absolute inset-0">
          {cardData.attachedItems.map((item, index) => (
            <div
              key={item.instanceId}
              className="absolute w-full h-full"
              style={{
                // zIndex of 0 is below the main card's zIndex of 10
                zIndex: 0,
                transform: `translateX(175px) translateY(${index * 25}px) rotate(90deg) scale(0.8)`,
                transformOrigin: 'top left',
              }}
            >
              <Card cardData={item} />
            </div>
          ))}
        </div>
      )}

      {/* --- The Contextual Action Menu --- */}
      {isSelected && (
        <div
          className="absolute left-full top-0 ml-2 w-48 bg-white rounded-lg shadow-2xl z-20 p-2"
          // Stop click from bubbling up to the parent div
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="space-y-1">
            <li>
              <button
                // We pass a custom action object to onActionClick
                onClick={() => onActionClick({ type: 'view' }, cardData)}
                className="w-full text-left px-3 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors"
              >
                View Details
              </button>
            </li>
            {cardData.availableActions && cardData.availableActions.map((action, index) => (
              <li key={`${action.type}-${index}`}>
                <button
                  onClick={() => onActionClick(action, cardData)}
                  disabled={action.disabled} // Crucially, use the 'disabled' prop!
                  title={action.disabled ? action.disabledMessage : ''}
                  className={`
                                          w-full text-left px-3 py-2 text-sm text-gray-800 rounded-md transition-colors
                                          ${action.disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Style for disabled
                      : 'bg-gray-100 hover:bg-blue-500 hover:text-white' // Style for enabled
                    }
                                      `}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CardOnField;