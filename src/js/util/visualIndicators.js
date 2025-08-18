import { L } from './lquery.js';
import { util } from './util.js';
import { constants } from './constants.js';

/**
 * Visual indicators utility for accessibility input methods
 * Provides clock-style progress indicators, shrinking dots, and scanning lines
 */
let VisualIndicators = {};



/**
 * Check if the device can handle visual indicators without performance issues
 * @returns {boolean} - True if visual indicators should be enabled
 */
VisualIndicators.isPerformanceCapable = function() {
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
    if (navigator.connection && navigator.connection.effectiveType &&
        (navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g')) {
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
VisualIndicators.createClockProgress = function(element, duration, color = constants.DEFAULT_HOVER_PROGRESS_COLOR, onComplete) {
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
VisualIndicators.createShrinkingDot = function(element, duration, color = constants.DEFAULT_HOVER_DOT_COLOR, onComplete) {
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
            const scale = 1 - (progress * 0.8); // Shrink to 20% of original size

            if (dotElement) {
                // Use transform3d for hardware acceleration and batch style changes
                dotElement.style.transform = `scale(${scale}) translateZ(0)`;
                dotElement.style.opacity = 1 - (progress * 0.3); // Slight fade
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

/**
 * Creates a visual scanning line that moves through grid elements
 * @param {string} containerSelector - Selector for the grid container
 * @param {boolean} isVertical - Whether the scanning is vertical (true) or horizontal (false)
 * @param {string} color - Color for the scanning line
 * @returns {object} - Object with show, hide, and destroy methods
 */
VisualIndicators.createScanningLine = function(containerSelector, isVertical = false, color = constants.DEFAULT_SCAN_LINE_COLOR) {
    let lineElement = null;
    let container = null;
    let lastClientRect = null;

    const show = (targetElements, durationMs = 0) => {
        if (!targetElements || targetElements.length === 0) {
            return;
        }

        // Resolve container and ensure positioning context
        container = document.querySelector(containerSelector) || document.querySelector('#grid-container') || document.querySelector('.area') || document.body;
        if (container && getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        // Create scanning line element once
        if (!lineElement) {
            lineElement = document.createElement('div');
            lineElement.className = 'scanning-line';
            lineElement.style.position = 'absolute';
            lineElement.style.backgroundColor = color;
            lineElement.style.zIndex = '9999';
            lineElement.style.pointerEvents = 'none';
            lineElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
            lineElement.style.borderRadius = '5px';
            lineElement.style.opacity = '0.95';
            container.appendChild(lineElement);
        }

        // Calculate line position and dimensions based on target elements
        const containerRect = container.getBoundingClientRect();
        let lineRect = { top: Infinity, left: Infinity, right: -Infinity, bottom: -Infinity };
        targetElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            lineRect.top = Math.min(lineRect.top, rect.top);
            lineRect.left = Math.min(lineRect.left, rect.left);
            lineRect.right = Math.max(lineRect.right, rect.right);
            lineRect.bottom = Math.max(lineRect.bottom, rect.bottom);
        });

        // Position line relative to container
        const relativeTop = lineRect.top - containerRect.top;
        const relativeLeft = lineRect.left - containerRect.left;
        const width = Math.max(0, lineRect.right - lineRect.left);
        const height = Math.max(0, lineRect.bottom - lineRect.top);

        // Smoothly animate to new position/size; duration matches scanning timeout
        const duration = Math.max(0, Math.floor(durationMs));
        const transitionProps = isVertical ? 'top, left, height' : 'top, left, width';
        lineElement.style.transitionProperty = transitionProps;
        lineElement.style.transitionDuration = `${duration}ms`;
        lineElement.style.transitionTimingFunction = 'linear';

        const lineThickness = 4;
        if (isVertical) {
            // Vertical scanning line centered within the target's width
            const centerLeft = relativeLeft + (width / 2) - (lineThickness / 2);
            lineElement.style.top = `${relativeTop}px`;
            lineElement.style.left = `${centerLeft}px`;
            lineElement.style.width = `${lineThickness}px`;
            lineElement.style.height = `${height}px`;
        } else {
            // Horizontal scanning line centered within the target's height
            const centerTop = relativeTop + (height / 2) - (lineThickness / 2);
            lineElement.style.top = `${centerTop}px`;
            lineElement.style.left = `${relativeLeft}px`;
            lineElement.style.width = `${width}px`;
            lineElement.style.height = `${lineThickness}px`;
        }

        // Cache latest client rect (viewport coords) for selection alignment
        try {
            lastClientRect = lineElement.getBoundingClientRect();
        } catch (e) {
            lastClientRect = null;
        }
    };

    const hide = () => {
        if (lineElement && lineElement.parentNode) {
            lineElement.parentNode.removeChild(lineElement);
        }
        lineElement = null;
        lastClientRect = null;
    };

    const destroy = () => {
        hide();
        container = null;
    };

    const getLineCenter = () => {
        const r = lineElement ? lineElement.getBoundingClientRect() : lastClientRect;
        if (!r) return null;
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    return { show, hide, destroy, getLineCenter };
};

export { VisualIndicators };
