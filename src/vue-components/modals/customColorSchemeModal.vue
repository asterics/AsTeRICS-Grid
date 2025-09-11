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
                        :scheme="editingScheme"
                        :additional-color-schemes="additionalColorSchemes"
                        @scheme-changed="onSchemeChanged"
                        @scheme-deleted="onSchemeDeleted"
                        @error="onError"
                    />
                </div>
                <div class="modal-footer">
                    <button
                        class="button-secondary"
                        @click="$emit('close')"
                    >
                        <i class="fas fa-times" aria-hidden="true"></i>
                        <span>{{ $t('cancel') }}</span>
                    </button>
                    <button
                        class="button-primary"
                        @click="saveScheme"
                        :disabled="!isValid"
                    >
                        <i class="fas fa-check" aria-hidden="true"></i>
                        <span>{{ $t('save') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import CustomColorSchemeEditor from '../components/customColorSchemeEditor.vue';
import { constants } from '../../js/util/constants';

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
        additionalColorSchemes: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            errorMessage: '',
            editingScheme: null,
            localAdditionalColorSchemes: []
        };
    },
    computed: {
        isEditMode() {
            return this.scheme !== null;
        },
        isValid() {
            return this.editingScheme &&
                   this.editingScheme.displayName &&
                   this.editingScheme.displayName.trim() !== '' &&
                   this.editingScheme.colors &&
                   this.editingScheme.colors.length > 0 &&
                   this.validateColorScheme(this.editingScheme);
        }
    },
    methods: {
        createCustomColorScheme(name, baseScheme = 'FITZGERALD') {
            let categories, mappings, colors;

            if (baseScheme === 'GOOSENS') {
                categories = constants.CS_GOOSSENS_CATEGORIES;
                colors = ['#fdcae1', '#84b6f4', '#c7f3c7', '#fdfd96', '#ffda89'];
            } else if (baseScheme === 'MONTESSORI') {
                categories = constants.CS_MONTESSORI_CATEGORIES;
                colors = [
                    '#ffffff', '#e3f5fa', '#eaeffd', '#FCE8E8', '#dff4df',
                    '#fbf3e4', '#fbf2ff', '#fff0f6', '#fbf7e4', '#e4e4e4'
                ];
            } else {
                // Default to Fitzgerald
                categories = constants.CS_FITZGERALD_CATEGORIES;
                mappings = constants.CS_MAPPING_TO_FITZGERALD;
                colors = [
                    '#fdfd96', '#ffda89', '#c7f3c7', '#84b6f4', '#fdcae1',
                    '#ffffff', '#bc98f3', '#d8af97', '#ff9688', '#bdbfbf'
                ];
            }

            return {
                name: constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' + name.toUpperCase().replace(/\s+/g, '_'),
                displayName: name,
                categories: categories,
                mappings: mappings,
                colors: colors,
                isCustom: true
            };
        },

        validateColorScheme(scheme) {
            if (!scheme || typeof scheme !== 'object') {
                return false;
            }

            // Check required properties
            if (!scheme.name || !scheme.displayName || !scheme.categories || !scheme.colors) {
                return false;
            }

            // Check that colors array matches categories length
            if (!Array.isArray(scheme.colors) || !Array.isArray(scheme.categories)) {
                return false;
            }

            if (scheme.colors.length !== scheme.categories.length) {
                return false;
            }

            // Validate hex colors
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            for (let color of scheme.colors) {
                if (!hexColorRegex.test(color)) {
                    return false;
                }
            }

            return true;
        },

        initializeData() {
            // Create deep copy of additional color schemes
            this.localAdditionalColorSchemes = JSON.parse(JSON.stringify(this.additionalColorSchemes));

            if (this.scheme && this.scheme.name) {
                // Edit mode - create deep copy of scheme
                this.editingScheme = JSON.parse(JSON.stringify(this.scheme));
            } else {
                // Create mode - create new scheme with base scheme type from settings
                let baseSchemeType = (this.scheme && this.scheme.baseSchemeType) ? this.scheme.baseSchemeType : 'FITZGERALD';
                this.editingScheme = this.createCustomColorScheme('New Theme', baseSchemeType);
            }
        },

        onSchemeChanged(updatedScheme) {
            this.editingScheme = updatedScheme;
        },

        onSchemeDeleted(deletedSchemeName) {
            // Remove from local array
            this.localAdditionalColorSchemes = this.localAdditionalColorSchemes.filter(
                scheme => scheme.name !== deletedSchemeName
            );

            // Emit the updated array
            this.$emit('save', this.localAdditionalColorSchemes, null);
            this.$emit('close');
        },

        saveScheme() {
            if (!this.isValid) {
                return;
            }

            try {
                // Update the scheme name based on display name if needed
                if (!this.isEditMode || this.editingScheme.displayName !== this.scheme.displayName) {
                    this.editingScheme.name = constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' +
                                               this.editingScheme.displayName.toUpperCase().replace(/\s+/g, '_');
                }

                // Check if updating existing scheme
                let existingIndex = this.localAdditionalColorSchemes.findIndex(
                    scheme => scheme.name === this.editingScheme.name
                );

                if (existingIndex !== -1) {
                    // Update existing
                    this.localAdditionalColorSchemes[existingIndex] = this.editingScheme;
                } else {
                    // Add new
                    this.localAdditionalColorSchemes.push(this.editingScheme);
                }

                // Emit the updated array and the active scheme
                this.$emit('save', this.localAdditionalColorSchemes, this.editingScheme.name);
                this.$emit('close');

            } catch (error) {
                console.error('Error saving custom color scheme:', error);
                this.onError(error.message || this.$t('errorSavingScheme'));
            }
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
            this.initializeData();
        },
        additionalColorSchemes() {
            this.initializeData();
        }
    },
    mounted() {
        this.initializeData();
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
    padding: 1.5rem 2rem 1rem;
}

.modal-footer {
    padding: 1rem 2rem 2rem;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
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
