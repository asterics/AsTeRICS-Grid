<template>
    <div class="custom-color-scheme-editor">
        <div class="srow">
            <label class="three columns" for="schemeName">
                <span>{{ $t('customSchemeDisplayName') }}</span>
            </label>
            <input 
                id="schemeName" 
                class="five columns" 
                type="text" 
                v-model="localScheme.displayName" 
                :placeholder="$t('enterSchemeName')"
                @input="validateName"
            />
        </div>
        
        <div class="srow" v-if="nameError">
            <div class="eight columns offset-by-three">
                <span class="text-danger">{{ nameError }}</span>
            </div>
        </div>

        <div class="srow">
            <label class="three columns" for="baseScheme">
                <span>{{ $t('baseSchemeType') }}</span>
            </label>
            <select
                id="baseScheme"
                class="five columns"
                v-model="selectedBaseScheme"
                @change="onBaseSchemeChange"
                :disabled="isEditMode"
            >
                <optgroup :label="$t('predefinedSchemes')">
                    <option
                        v-for="scheme in constants.DEFAULT_COLOR_SCHEMES"
                        :key="scheme.name"
                        :value="scheme.name"
                    >
                        {{ scheme.name | translate }}
                    </option>
                </optgroup>
            </select>
        </div>

        <div class="srow mt-4">
            <h4>{{ $t('categoryColors') }}</h4>
        </div>

        <div class="color-categories">
            <div
                class="srow color-category-row"
                v-for="(category, index) in localScheme.categories"
                :key="category"
            >
                <label class="four columns category-label" :for="`color-picker-${index}`">
                    <span>{{ $t(category) }}</span>
                </label>
                <div class="color-input-container five columns">
                    <input
                        :id="`color-picker-${index}`"
                        type="color"
                        :value="localScheme.colors[index]"
                        @input="updateColor(index, $event.target.value)"
                        class="color-picker"
                    />
                    <input
                        :id="`color-text-${index}`"
                        type="text"
                        :value="localScheme.colors[index]"
                        @input="updateColor(index, $event.target.value)"
                        class="color-text-input"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                </div>
            </div>
        </div>



        <div class="srow mt-4">
            <div class="reset-section eight columns">
                <button
                    class="button-secondary"
                    @click="resetToDefaults"
                >
                    {{ $t('resetToDefaults') }}
                </button>
                <button
                    v-if="isEditMode && localScheme.isCustom"
                    class="button-danger ml-2"
                    @click="deleteScheme"
                >
                    {{ $t('deleteScheme') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { constants } from '../../js/util/constants';

export default {
    name: 'CustomColorSchemeEditor',
    props: {
        scheme: {
            type: Object,
            default: null
        },
        additionalColorSchemes: {
            type: Array,
            required: true
        },
        initialBaseScheme: {
            type: String,
            default: 'CS_MODIFIED_FITZGERALD_KEY_LIGHT'
        }
    },
    data() {
        return {
            localScheme: null,
            selectedBaseScheme: 'CS_MODIFIED_FITZGERALD_KEY_LIGHT',
            nameError: '',
            isEditMode: false,
            originalScheme: null,
            constants: constants
        };
    },
    computed: {
        isValid() {
            return this.localScheme && 
                   this.localScheme.displayName && 
                   this.localScheme.displayName.trim() !== '' &&
                   !this.nameError &&
                   this.localScheme.colors &&
                   this.localScheme.colors.length > 0;
        }
    },
    watch: {
        scheme: {
            handler(newScheme) {
                this.initializeScheme(newScheme);
            },
            immediate: true
        }
    },
    methods: {
        initializeScheme(scheme) {
            if (scheme) {
                // Edit mode
                this.isEditMode = true;
                this.originalScheme = JSON.parse(JSON.stringify(scheme));
                this.localScheme = JSON.parse(JSON.stringify(scheme));
                
                // Determine base scheme family and set to LIGHT variant for display (select is disabled)
                if (scheme.categories === constants.CS_GOOSSENS_CATEGORIES) {
                    this.selectedBaseScheme = constants.COLOR_SCHEME_GOOSENS_LIGHT;
                } else if (scheme.categories === constants.CS_MONTESSORI_CATEGORIES) {
                    this.selectedBaseScheme = constants.COLOR_SCHEME_MONTESSORI_LIGHT;
                } else {
                    this.selectedBaseScheme = constants.COLOR_SCHEME_FITZGERALD_LIGHT;
                }
            } else {
                // Create mode
                this.isEditMode = false;
                this.originalScheme = null;
                // Use initialBaseScheme provided by parent (modal) to preselect base scheme (expects a scheme name)
                this.selectedBaseScheme = this.initialBaseScheme || constants.COLOR_SCHEME_FITZGERALD_LIGHT;
                this.createNewScheme();
            }
        },
        
        createNewScheme() {
            // selectedBaseScheme is the name of a predefined scheme (e.g., CS_GOOSENS_LIGHT)
            const base = this.constants.DEFAULT_COLOR_SCHEMES.find(s => s.name === this.selectedBaseScheme)
                || this.constants.DEFAULT_COLOR_SCHEMES[0];
            const categories = base.categories;
            const mappings = base.mappings; // may be undefined for some families
            const colors = JSON.parse(JSON.stringify(base.colors));
            this.localScheme = {
                name: undefined,
                displayName: 'New Theme',
                categories,
                mappings,
                colors,
                isCustom: true
            };
            this.$emit('scheme-changed', this.localScheme);
        },
        
        onBaseSchemeChange() {
            if (!this.isEditMode) {
                this.createNewScheme();
            }
        },
        
        updateColor(index, color) {
            if (this.localScheme && this.localScheme.colors && index < this.localScheme.colors.length) {
                this.$set(this.localScheme.colors, index, color);
                this.$emit('scheme-changed', this.localScheme);
            }
        },
        
        validateName() {
            this.nameError = '';

            if (!this.localScheme.displayName || this.localScheme.displayName.trim() === '') {
                this.nameError = this.$t('schemeNameRequired');
                return;
            }

            // Check if name is available (only for new schemes or if name changed)
            if (!this.isEditMode ||
                (this.originalScheme && this.originalScheme.displayName !== this.localScheme.displayName)) {
                let schemeName = constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' +
                               this.localScheme.displayName.toUpperCase().replace(/\s+/g, '_');

                if (this.additionalColorSchemes.some(scheme => scheme.name === schemeName)) {
                    this.nameError = this.$t('schemeNameAlreadyExists');
                }
            }

            // Emit the updated scheme
            this.$emit('scheme-changed', this.localScheme);
        },
        
        resetToDefaults() {
            if (this.isEditMode && this.originalScheme) {
                this.localScheme = JSON.parse(JSON.stringify(this.originalScheme));
            } else {
                this.createNewScheme();
            }
            this.nameError = '';
            this.$emit('scheme-changed', this.localScheme);
        },

        async deleteScheme() {
            if (!this.isEditMode || !this.localScheme.isCustom) {
                return;
            }

            if (!confirm(this.$t('confirmDeleteScheme', [this.localScheme.displayName]))) {
                return;
            }

            this.$emit('scheme-deleted', this.localScheme.name);
        }
    }
};
</script>

<style scoped>
.custom-color-scheme-editor {
    padding: 1rem;
}

.color-category-row {
    align-items: center;
    margin-bottom: 0.5rem;
}

.category-label {
    font-weight: bold;
}

.color-input-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.color-picker {
    width: 40px;
    height: 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
}

.color-text-input {
    width: 80px;
    font-family: monospace;
    font-size: 0.9rem;
}



.reset-section {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
}

.text-danger {
    color: #d32f2f;
    font-size: 0.9rem;
}

.button-danger {
    background-color: #d32f2f;
    color: white;
}

.button-danger:hover {
    background-color: #b71c1c;
}

.ml-2 {
    margin-left: 0.5rem;
}
</style>
