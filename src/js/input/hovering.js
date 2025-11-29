import { L } from '../util/lquery.js';
import $ from '../externals/jquery.js';
import { inputEventHandler } from './inputEventHandler';
import { util } from '../util/util';
import { speechService } from '../service/speechService';
import { i18nService } from '../service/i18nService';
import { MainVue } from '../vue/mainVue';
import { stateService } from '../service/stateService';
import { constants } from '../util/constants';
import { InputConfig } from '../model/InputConfig';

let Hover = {};
Hover.getInstanceFromConfig = function (inputConfig, itemSelector, options) {
    options = options || {};
    return new HoverConstructor(itemSelector, {
        selectionListener: options.selectionListener,
        activeListener: options.activeListener,
        containerClass: options.containerClass,
        inputEventSelect: inputConfig.seqInputs.filter((e) => e.label === InputConfig.SELECT)[0],
        inputEventNext: inputConfig.seqInputs.filter((e) => e.label === InputConfig.NEXT)[0],
        timeoutMs: inputConfig.hoverTimeoutMs,
        demoMode: options.demoMode || inputConfig.hoverDisableHoverpane,
        hideCursor: inputConfig.hoverHideCursor,
        progressIndicator: inputConfig.hoverProgressIndicator || 'circle',
        progressColor: inputConfig.hoverProgressColor || '#2196F3',
        showPercentage: inputConfig.hoverShowPercentage || false,
        feedbackAnimation: inputConfig.hoverFeedbackAnimation || 'smooth'
    });
};

function HoverConstructor(itemSelector, options) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverTimeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : 1000;
    let _demoMode = options.demoMode;
    let _selectionListener = options.selectionListener;
    let _activeListener = options.activeListener;
    let _progressIndicator = options.progressIndicator || 'circle';
    let _progressColor = options.progressColor || '#2196F3';
    let _showPercentage = options.showPercentage || false;
    let _feedbackAnimation = options.feedbackAnimation || 'smooth';

    var _hoverMap = {};
    var _progressMap = {}; // Store progress indicators for each element
    var _intervalMap = {}; // Store animation intervals
    let _elements = [];
    let _lastElement = null;
    let _lastTouchEvent = null;
    let _touchElementHidden = false;
    let _inputEventHandler = null;

    function mouseEnter(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        onElement(target);
        _lastElement = target;
        _lastTouchEvent = event;
    }

    function mouseLeave(event, targetParam) {
        if (!_touchElementHidden) {
            return;
        }
        var target = targetParam || this;
        event.preventDefault();
        offElement(target);
    }

    function mouseMove(event) {
        if (!_touchElementHidden) {
            setTouchElementVisibility(false);
        }
        util.debounce(
            () => {
                setTouchElementVisibility(true);
            },
            _hoverTimeoutMs + 300,
            'hovering-mouseMove'
        );
    }

    function mouseUp() {
        offElement(_lastElement);
    }

    function touchStart(event) {
        let element = getTouchEventElement(event);
        onElement(element);
        _lastElement = element;
    }

    function touchEnd(event) {
        offElement(_lastElement);
    }

    function touchMove(event) {
        if (!_demoMode) {
            event.preventDefault();
        }
        util.throttle(
            () => {
                let element = getTouchEventElement(event);
                onElement(element);
                _lastElement = element;
                _lastTouchEvent = event;
            },
            [],
            50,
            'hovering-touchmove'
        );
    }

    function clickHandler(event) {
        speechService.speak(i18nService.t('speechOutputActivated'));
        MainVue.clearTooltip();
        stateService.setState(constants.STATE_ACTIVATED_TTS, true);
        setTouchElementVisibility(true);
        _elements.forEach(function (item) {
            item.removeEventListener('click', clickHandler);
        });
    }

    // Create progress indicator element based on type
    function createProgressIndicator(element, type) {
        let indicator = document.createElement('div');
        indicator.className = 'hover-progress-indicator hover-progress-' + type;
        indicator.style.setProperty('--progress-color', _progressColor);

        if (type === 'circle') {
            let size = Math.min(element.offsetWidth, element.offsetHeight) * 0.8;
            indicator.innerHTML = `
                <svg class="progress-circle" width="${size}" height="${size}" viewBox="0 0 100 100">
                    <circle class="progress-circle-bg" cx="50" cy="50" r="45" />
                    <circle class="progress-circle-fill" cx="50" cy="50" r="45" />
                    ${_showPercentage ? '<text class="progress-text" x="50" y="50" text-anchor="middle" dominant-baseline="middle">0%</text>' : ''}
                </svg>
            `;
        } else if (type === 'border') {
            indicator.innerHTML = `<div class="progress-border"></div>`;
        } else if (type === 'glow') {
            indicator.innerHTML = `<div class="progress-glow"></div>`;
        }

        return indicator;
    }

    // Animate progress indicator
    function animateProgress(element, indicator, startTime) {
        let type = _progressIndicator;

        function updateProgress() {
            let elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / _hoverTimeoutMs, 1);
            let percentage = Math.round(progress * 100);

            if (type === 'circle') {
                let circle = indicator.querySelector('.progress-circle-fill');
                if (circle) {
                    let circumference = 2 * Math.PI * 45;
                    let offset = circumference * (1 - progress);
                    circle.style.strokeDasharray = circumference;
                    circle.style.strokeDashoffset = offset;
                }
                if (_showPercentage) {
                    let text = indicator.querySelector('.progress-text');
                    if (text) {
                        text.textContent = percentage + '%';
                    }
                }
            } else if (type === 'border') {
                let border = indicator.querySelector('.progress-border');
                if (border) {
                    border.style.setProperty('--progress', progress);
                }
            } else if (type === 'glow') {
                let glow = indicator.querySelector('.progress-glow');
                if (glow) {
                    glow.style.opacity = 0.3 + (progress * 0.7);
                    glow.style.transform = `scale(${1 + progress * 0.1})`;
                }
            }

            if (progress < 1) {
                _intervalMap[element] = requestAnimationFrame(updateProgress);
            }
        }

        _intervalMap[element] = requestAnimationFrame(updateProgress);
    }

    // Remove progress indicator
    function removeProgressIndicator(element) {
        if (_intervalMap[element]) {
            cancelAnimationFrame(_intervalMap[element]);
            _intervalMap[element] = null;
        }
        if (_progressMap[element]) {
            _progressMap[element].remove();
            _progressMap[element] = null;
        }
    }

    function onElement(element) {
        if (_lastElement && _lastElement !== element) {
            offElement(_lastElement);
        }
        if (!element || _hoverMap[element]) {
            return;
        }
        L.addClass(element, 'mouseentered');
        L.addClass(element, 'hover-animation-' + _feedbackAnimation);

        // Add progress indicator if not classic mode
        if (_progressIndicator !== 'classic' && _hoverTimeoutMs > 0) {
            let indicator = createProgressIndicator(element, _progressIndicator);
            element.appendChild(indicator);
            _progressMap[element] = indicator;
            animateProgress(element, indicator, Date.now());
        }

        if (_activeListener && element !== _lastElement) {
            _activeListener(element);
        }
        if (_hoverTimeoutMs !== 0) {
            _hoverMap[element] = setTimeout(function () {
                if (_selectionListener) {
                    _selectionListener(element);
                }
            }, _hoverTimeoutMs);
        }
    }

    function offElement(element) {
        if (!element) {
            return;
        }
        L.removeClass(element, 'mouseentered');
        L.removeClass(element, 'hover-animation-smooth');
        L.removeClass(element, 'hover-animation-pulse');
        L.removeClass(element, 'hover-animation-none');
        removeProgressIndicator(element);
        clearTimeout(_hoverMap[element]);
        _hoverMap[element] = null;
        _lastElement = null;
    }

    function getTouchEventElement(event) {
        if (event.touches && event.touches.length === 0) {
            event = _lastTouchEvent;
        }
        if (!event) {
            log.warn('no event');
            return;
        }
        let x = event.touches ? event.touches[0].pageX : event.pageX || event.clientX;
        let y = event.touches ? event.touches[0].pageY : event.pageY || event.clientY;
        return util.getElement(_elements, x, y);
    }

    function setTouchElementVisibility(visible) {
        _touchElementHidden = !visible;
        if (!_demoMode) {
            if (visible) {
                $('#touchElement').show();
            } else {
                $('#touchElement').hide();
            }
        }
    }

    thiz.startHovering = function () {
        if (options.hideCursor) {
            /* $(_itemSelector).css('cursor', 'none'); // not needed anymore - done in appGridElement and appGridDisplay
            if (options.containerClass) {
                $(options.containerClass).css('cursor', 'none');
            } */
            $('#touchElement').css('cursor', 'none');
        }
        _elements = L.selectAsList(_itemSelector);
        let alreadyActivatedTTS = stateService.getState(constants.STATE_ACTIVATED_TTS);
        if (speechService.nativeSpeechSupported() && !alreadyActivatedTTS && !_demoMode) {
            MainVue.setTooltip(i18nService.t('tapOnAnyElementToActivateSpeech'));
            stateService.onStateChanged(constants.STATE_ACTIVATED_TTS, (acivatedTTS) => {
                if (acivatedTTS) {
                    MainVue.clearTooltip();
                }
            });
            _elements.forEach(function (item) {
                item.addEventListener('click', clickHandler);
            });
        } else {
            setTouchElementVisibility(true);
        }
        _elements.forEach(function (item) {
            item.addEventListener('mouseenter', mouseEnter);
            item.addEventListener('mouseleave', mouseLeave);
            item.addEventListener('mouseup', mouseUp);
        });
        _inputEventHandler = inputEventHandler.instance();
        _inputEventHandler.onTouchStart(touchStart);
        _inputEventHandler.onTouchEnd(touchEnd);
        _inputEventHandler.onTouchMove(touchMove);
        _inputEventHandler.startListening();
        document.addEventListener('mousemove', mouseMove);
    };

    thiz.destroy = function () {
        if (options.hideCursor) {
            /* $(_itemSelector).css('cursor', 'default'); // // not needed anymore - done in appGridElement and appGridDisplay
            if (options.containerClass) {
                $(options.containerClass).css('cursor', 'default');
            }*/
            $('#touchElement').css('cursor', 'default');
        }
        util.clearDebounce('hovering-mouseMove');
        _elements.forEach(function (item) {
            item.removeEventListener('mouseenter', mouseEnter);
            item.removeEventListener('mouseleave', mouseLeave);
            item.removeEventListener('mouseup', mouseUp);
            item.removeEventListener('click', clickHandler);
            removeProgressIndicator(item);
        });
        _inputEventHandler.destroy();
        document.removeEventListener('mousemove', mouseMove);
        Object.keys(_hoverMap).forEach((key) => {
            clearTimeout(_hoverMap[key]);
        });
        stateService.clearListeners(constants.STATE_ACTIVATED_TTS);
    };

    thiz.setHoverTimeout = function (timeoutMs) {
        _hoverTimeoutMs = timeoutMs;
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export { Hover };
