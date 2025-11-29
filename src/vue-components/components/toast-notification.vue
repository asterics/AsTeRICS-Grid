<template>
    <transition-group name="toast-list" tag="div" class="toast-container" :class="'toast-container-' + position">
        <div
            v-for="toast in toasts"
            :key="toast.id"
            class="toast"
            :class="['toast-' + toast.type, {'toast-with-icon': toast.icon}]"
            role="alert"
            :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
        >
            <div class="toast-content">
                <i v-if="toast.icon" class="toast-icon" :class="getIcon(toast.type)"></i>
                <div class="toast-message">
                    <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
                    <div class="toast-text">{{ toast.message }}</div>
                </div>
            </div>
            <button
                v-if="toast.closable"
                class="toast-close"
                @click="remove(toast.id)"
                :aria-label="$t ? $t('close') : 'Close'"
            >
                <i class="fas fa-times"></i>
            </button>
        </div>
    </transition-group>
</template>

<script>
export default {
    name: 'ToastNotification',
    data() {
        return {
            toasts: [],
            position: 'top-right' // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
        };
    },
    methods: {
        add(toast) {
            const id = Date.now() + Math.random();
            const newToast = {
                id,
                type: toast.type || 'info',
                message: toast.message || '',
                title: toast.title || '',
                duration: toast.duration !== undefined ? toast.duration : 5000,
                closable: toast.closable !== undefined ? toast.closable : true,
                icon: toast.icon !== undefined ? toast.icon : true
            };

            this.toasts.push(newToast);

            if (newToast.duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, newToast.duration);
            }

            return id;
        },
        remove(id) {
            const index = this.toasts.findIndex(t => t.id === id);
            if (index !== -1) {
                this.toasts.splice(index, 1);
            }
        },
        clear() {
            this.toasts = [];
        },
        setPosition(position) {
            this.position = position;
        },
        getIcon(type) {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            return icons[type] || icons.info;
        }
    }
};
</script>

<style scoped>
.toast-container {
    position: fixed;
    z-index: var(--z-tooltip);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    pointer-events: none;
    max-width: 400px;
}

/* Positions */
.toast-container-top-right {
    top: var(--space-lg);
    right: var(--space-lg);
}

.toast-container-top-left {
    top: var(--space-lg);
    left: var(--space-lg);
}

.toast-container-bottom-right {
    bottom: var(--space-lg);
    right: var(--space-lg);
}

.toast-container-bottom-left {
    bottom: var(--space-lg);
    left: var(--space-lg);
}

.toast-container-top-center {
    top: var(--space-lg);
    left: 50%;
    transform: translateX(-50%);
}

.toast-container-bottom-center {
    bottom: var(--space-lg);
    left: 50%;
    transform: translateX(-50%);
}

/* Toast card */
.toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    min-width: 300px;
    padding: var(--space-md) var(--space-lg);
    background-color: var(--color-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    pointer-events: auto;
    border-left: 4px solid;
    transition: all var(--transition-fast);
}

.toast:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2xl);
}

/* Types */
.toast-success {
    border-left-color: var(--color-success);
}

.toast-error {
    border-left-color: var(--color-danger);
}

.toast-warning {
    border-left-color: var(--color-warning);
}

.toast-info {
    border-left-color: var(--color-info);
}

/* Content */
.toast-content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    flex: 1;
}

.toast-icon {
    font-size: var(--text-xl);
    flex-shrink: 0;
    margin-top: 2px;
}

.toast-success .toast-icon {
    color: var(--color-success);
}

.toast-error .toast-icon {
    color: var(--color-danger);
}

.toast-warning .toast-icon {
    color: var(--color-warning);
}

.toast-info .toast-icon {
    color: var(--color-info);
}

.toast-message {
    flex: 1;
}

.toast-title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-base);
    color: var(--color-gray-900);
    margin-bottom: var(--space-xs);
}

.toast-text {
    font-size: var(--text-sm);
    color: var(--color-gray-700);
    line-height: var(--line-height-normal);
}

/* Close button */
.toast-close {
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: var(--color-gray-500);
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    line-height: 1;
}

.toast-close:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
}

/* Transitions */
.toast-list-enter-active {
    animation: toastSlideIn var(--transition-slow);
}

.toast-list-leave-active {
    animation: toastSlideOut var(--transition-slow);
}

@keyframes toastSlideIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes toastSlideOut {
    from {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateX(100%) scale(0.8);
    }
}

/* For left-positioned toasts */
.toast-container-top-left .toast-list-enter-active,
.toast-container-bottom-left .toast-list-enter-active {
    animation: toastSlideInLeft var(--transition-slow);
}

.toast-container-top-left .toast-list-leave-active,
.toast-container-bottom-left .toast-list-leave-active {
    animation: toastSlideOutLeft var(--transition-slow);
}

@keyframes toastSlideInLeft {
    from {
        opacity: 0;
        transform: translateX(-100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes toastSlideOutLeft {
    from {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateX(-100%) scale(0.8);
    }
}

/* Responsive */
@media (max-width: 640px) {
    .toast-container {
        max-width: calc(100% - var(--space-lg) * 2);
        left: var(--space-lg) !important;
        right: var(--space-lg) !important;
        transform: none !important;
    }

    .toast {
        min-width: unset;
        width: 100%;
    }
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
    .toast,
    .toast-list-enter-active,
    .toast-list-leave-active {
        animation: none;
        transition: none;
    }

    .toast:hover {
        transform: none;
    }
}
</style>
