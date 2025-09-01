<template>
    <div class="modal" @click="$emit('close')">
        <div class="modal-wrapper">
            <div class="modal-container" @click.stop>
                <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')">
                    <i class="fas fa-times"></i>
                </a>
                <div class="modal-header">
                    <h1>{{ isEditMode ? $t('editCustomColorScheme') : $t('createCustomColorScheme') }}</h1>
                </div>
                <div class="modal-body">
                    <div v-if="errorMessage" class="alert alert-danger">
                        {{ errorMessage }}
                    </div>
                    
                    <custom-color-scheme-editor
                        :scheme="scheme"
                        :metadata="metadata"
                        @scheme-saved="onSchemeSaved"
                        @scheme-deleted="onSchemeDeleted"
                        @error="onError"
                        @cancel="$emit('close')"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import CustomColorSchemeEditor from '../components/customColorSchemeEditor.vue';

export default {
    name: 'CustomColorSchemeModal',
    components: {
        CustomColorSchemeEditor
    },
    props: {
        scheme: {
            type: Object,
            default: null
        },
        metadata: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            errorMessage: ''
        };
    },
    computed: {
        isEditMode() {
            return this.scheme !== null;
        }
    },
    methods: {
        onSchemeSaved(savedScheme) {
            this.$emit('scheme-saved', savedScheme);
            this.$emit('close');
        },
        
        onSchemeDeleted(deletedSchemeName) {
            this.$emit('scheme-deleted', deletedSchemeName);
            this.$emit('close');
        },
        
        onError(errorMessage) {
            this.errorMessage = errorMessage;
            // Clear error after 5 seconds
            setTimeout(() => {
                this.errorMessage = '';
            }, 5000);
        }
    },
    watch: {
        scheme() {
            // Clear error when scheme changes
            this.errorMessage = '';
        }
    }
};
</script>

<style scoped>
.modal {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 2rem;
}

.modal-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 800px;
    max-height: 90vh;
    width: 100%;
    overflow-y: auto;
    position: relative;
}

.modal-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
}

.modal-body {
    padding: 1.5rem 2rem 2rem;
}

.close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    color: #666;
    text-decoration: none;
    z-index: 1;
}

.close-button:hover {
    color: #333;
}

.alert {
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid transparent;
    border-radius: 4px;
}

.alert-danger {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

/* Responsive design */
@media (max-width: 768px) {
    .modal-wrapper {
        padding: 1rem;
    }
    
    .modal-container {
        max-height: 95vh;
    }
    
    .modal-header,
    .modal-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>
