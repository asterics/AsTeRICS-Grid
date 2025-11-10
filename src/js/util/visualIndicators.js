import { L } from './lquery.js';
import { util } from './util.js';
import { constants } from './constants.js';

/**
 * Visual indicators utility for accessibility input methods
 * Provides clock-style progress indicators and shrinking dots
 */
let VisualIndicators = {};

/**
 * Check if the device can handle visual indicators without performance issues
 * @returns {boolean} - True if visual indicators should be enabled
 */
VisualIndicators.isPerformanceCapable = function () {
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }

    // Check for low-end device indicators
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return false;
    }

    // Check for low memory devices
    if (navigator.deviceMemory && navigator.deviceMemory < 2) {
        return false;
    }

    // Check for slow connection
    if (
        navigator.connection &&
        navigator.connection.effectiveType &&
        (navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g')
    ) {
        return false;
    }

    return true;
};

/**
 * Creates a clock-style progress indicator for hover/dwell functionality
 * @param {HTMLElement} element - The target element to attach the indicator to
 * @param {number} duration - Duration in milliseconds for the progress
 * @param {string} color - Color for the progress indicator
 * @param {function} onComplete - Callback when progress completes
 * @returns {object} - Object with start, stop, and destroy methods
 */
VisualIndicators.createClockProgress = function (
    element,
    duration,
    color = constants.DEFAULT_HOVER_PROGRESS_COLOR,
    onComplete
) {
    let progressElement = null;
    let animationId = null;
    let startTime = null;
    let isRunning = false;

    const start = () => {
        if (isRunning) return;

        // Create progress indicator element
        progressElement = document.createElement('div');
        progressElement.className = 'hover-clock-progress';
        progressElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin: -20px 0 0 -20px;
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            transform-origin: center;
            background: conic-gradient(${color} 0deg 0deg, rgba(255,255,255,0.3) 0deg 360deg);
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            border: 2px solid rgba(255,255,255,0.8);
        `;

        // Position relative to element
        const rect = element.getBoundingClientRect();
        const container = element.closest('.element-container') || element;
        container.style.position = 'relative';
        container.appendChild(progressElement);

        startTime = Date.now();
        isRunning = true;

        const animate = () => {
            if (!isRunning) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const rotation = progress * 360;

            if (progressElement) {
                // Update the border to show progress (like a pie chart)
                const angle = progress * 360;
                progressElement.style.background = `conic-gradient(${color} 0deg ${angle}deg, transparent ${angle}deg 360deg)`;
                progressElement.style.transform = `translateZ(0)`;
            }

            if (progress >= 1) {
                isRunning = false;
                if (onComplete) onComplete();
            } else {
                animationId = requestAnimationFrame(animate);
            }
        };

        animationId = requestAnimationFrame(animate);
    };

    const stop = () => {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    const destroy = () => {
        stop();
        if (progressElement && progressElement.parentNode) {
            progressElement.parentNode.removeChild(progressElement);
        }
        progressElement = null;
    };

    return { start, stop, destroy };
};

/**
 * Creates a shrinking dot indicator for hover/dwell functionality
 * @param {HTMLElement} element - The target element to attach the indicator to
 * @param {number} duration - Duration in milliseconds for the shrinking
 * @param {string} color - Color for the dot indicator
 * @param {function} onComplete - Callback when shrinking completes
 * @returns {object} - Object with start, stop, and destroy methods
 */
VisualIndicators.createShrinkingDot = function (
    element,
    duration,
    color = constants.DEFAULT_HOVER_DOT_COLOR,
    onComplete
) {
    let dotElement = null;
    let animationId = null;
    let startTime = null;
    let isRunning = false;

    const start = () => {
        if (isRunning) return;

        // Create dot indicator element
        dotElement = document.createElement('div');
        dotElement.className = 'hover-shrinking-dot';
        dotElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 30px;
            height: 30px;
            margin: -15px 0 0 -15px;
            background-color: ${color};
            border-radius: 50%;
            z-index: 9998;
            pointer-events: none;
            transform-origin: center;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            border: 2px solid white;
        `;

        // Position relative to element
        const container = element.closest('.element-container') || element;
        container.style.position = 'relative';
        container.appendChild(dotElement);

        startTime = Date.now();
        isRunning = true;

        const animate = () => {
            if (!isRunning) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const scale = 1 - progress * 0.8; // Shrink to 20% of original size

            if (dotElement) {
                // Use transform3d for hardware acceleration and batch style changes
                dotElement.style.transform = `scale(${scale}) translateZ(0)`;
                dotElement.style.opacity = 1 - progress * 0.3; // Slight fade
            }

            if (progress >= 1) {
                isRunning = false;
                if (onComplete) onComplete();
            } else {
                animationId = requestAnimationFrame(animate);
            }
        };

        animationId = requestAnimationFrame(animate);
    };

    const stop = () => {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };

    const destroy = () => {
        stop();
        if (dotElement && dotElement.parentNode) {
            dotElement.parentNode.removeChild(dotElement);
        }
        dotElement = null;
    };

    return { start, stop, destroy };
};

export { VisualIndicators };
