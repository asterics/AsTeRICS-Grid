<template>
    <div class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
        <slot></slot>
        <transition name="tooltip-fade">
            <div
                v-if="isVisible"
                class="tooltip"
                :class="['tooltip-' + position, {'tooltip-dark': dark}]"
                role="tooltip"
                :aria-hidden="!isVisible"
            >
                <div class="tooltip-arrow" :class="'tooltip-arrow-' + position"></div>
                <div class="tooltip-content">
                    {{ text }}
                    <slot name="content"></slot>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: 'Tooltip',
    props: {
        text: {
            type: String,
            default: ''
        },
        position: {
            type: String,
            default: 'top',
            validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
        },
        dark: {
            type: Boolean,
            default: true
        },
        delay: {
            type: Number,
            default: 200
        }
    },
    data() {
        return {
            isVisible: false,
            timeoutId: null
        };
    },
    methods: {
        show() {
            this.timeoutId = setTimeout(() => {
                this.isVisible = true;
            }, this.delay);
        },
        hide() {
            clearTimeout(this.timeoutId);
            this.isVisible = false;
        }
    },
    beforeDestroy() {
        clearTimeout(this.timeoutId);
    }
};
</script>

<style scoped>
.tooltip-wrapper {
    display: inline-block;
    position: relative;
}

.tooltip {
    position: absolute;
    z-index: var(--z-tooltip);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
    line-height: var(--line-height-normal);
    border-radius: var(--radius-md);
    pointer-events: none;
    white-space: nowrap;
    max-width: 250px;
    word-wrap: break-word;
    white-space: normal;
}

.tooltip-dark {
    background-color: var(--color-gray-900);
    color: var(--color-white);
    box-shadow: var(--shadow-lg);
}

.tooltip:not(.tooltip-dark) {
    background-color: var(--color-white);
    color: var(--color-gray-900);
    border: 1px solid var(--color-gray-300);
    box-shadow: var(--shadow-lg);
}

/* Positions */
.tooltip-top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
}

.tooltip-bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
}

.tooltip-left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
}

.tooltip-right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
}

/* Arrows */
.tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
}

.tooltip-dark .tooltip-arrow-top {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0 6px;
    border-color: var(--color-gray-900) transparent transparent transparent;
}

.tooltip-dark .tooltip-arrow-bottom {
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-color: transparent transparent var(--color-gray-900) transparent;
}

.tooltip-dark .tooltip-arrow-left {
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 0 6px 6px;
    border-color: transparent transparent transparent var(--color-gray-900);
}

.tooltip-dark .tooltip-arrow-right {
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 6px 6px 0;
    border-color: transparent var(--color-gray-900) transparent transparent;
}

/* Light arrows */
.tooltip:not(.tooltip-dark) .tooltip-arrow-top {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0 6px;
    border-color: var(--color-white) transparent transparent transparent;
}

.tooltip:not(.tooltip-dark) .tooltip-arrow-bottom {
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-color: transparent transparent var(--color-white) transparent;
}

.tooltip:not(.tooltip-dark) .tooltip-arrow-left {
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 0 6px 6px;
    border-color: transparent transparent transparent var(--color-white);
}

.tooltip:not(.tooltip-dark) .tooltip-arrow-right {
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 6px 6px 0;
    border-color: transparent var(--color-white) transparent transparent;
}

/* Transitions */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.tooltip-fade-enter,
.tooltip-fade-leave-to {
    opacity: 0;
}

.tooltip-top.tooltip-fade-enter,
.tooltip-top.tooltip-fade-leave-to {
    transform: translateX(-50%) translateY(4px);
}

.tooltip-bottom.tooltip-fade-enter,
.tooltip-bottom.tooltip-fade-leave-to {
    transform: translateX(-50%) translateY(-4px);
}

.tooltip-left.tooltip-fade-enter,
.tooltip-left.tooltip-fade-leave-to {
    transform: translateY(-50%) translateX(4px);
}

.tooltip-right.tooltip-fade-enter,
.tooltip-right.tooltip-fade-leave-to {
    transform: translateY(-50%) translateX(-4px);
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
    .tooltip-fade-enter-active,
    .tooltip-fade-leave-active {
        transition: none;
    }
}
</style>
