// src/components/game/CoinFlipAnimation.jsx

import React, { useEffect } from 'react';
import './CoinFlip.css';

const CoinFlipAnimation = ({ result, onAnimationEnd }) => {

    useEffect(() => {
        // The CSS animation will last 3.5 seconds. This timer just tells
        // the parent component to unmount us when the animation is over.
        const endTimer = setTimeout(() => {
            onAnimationEnd();
        }, 3500);

        return () => clearTimeout(endTimer);
    }, [onAnimationEnd]);

    return (
        <div className="coin-flip-overlay">
            <div className="scene">
                {/* We apply the 'heads' or 'tails' class from the very beginning.
                    The CSS will use this to determine the final landing spot. */}
                <div className={`coin ${result}`}>
                    <div className="coin-face coin-heads"></div>
                    <div className="coin-face coin-tails"></div>
                </div>
            </div>
        </div>
    );
};

export default CoinFlipAnimation;