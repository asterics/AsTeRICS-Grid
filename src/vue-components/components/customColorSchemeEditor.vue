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
                <option value="FITZGERALD">{{ $t('CS_MODIFIED_FITZGERALD_KEY_LIGHT') }}</option>
                <option value="GOOSENS">{{ $t('CS_GOOSENS_LIGHT') }}</option>
                <option value="MONTESSORI">{{ $t('CS_MONTESSORI_LIGHT') }}</option>
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
                <label class="four columns category-label">
                    <span>{{ $t(category) }}</span>
                </label>
                <div class="color-input-container three columns">
                    <input 
                        type="color" 
                        :value="localScheme.colors[index]" 
                        @input="updateColor(index, $event.target.value)"
                        class="color-picker"
                    />
                    <input 
                        type="text" 
                        :value="localScheme.colors[index]" 
                        @input="updateColor(index, $event.target.value)"
                        class="color-text-input"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                </div>
                <div class="color-preview two columns">
                    <div 
                        class="color-preview-box" 
                        :style="`background-color: ${localScheme.colors[index]};`"
                        :title="localScheme.colors[index]"
                    ></div>
                </div>
            </div>
        </div>

        <div class="srow mt-4">
            <h4>{{ $t('preview') }}</h4>
        </div>

        <div class="srow">
            <div class="color-scheme-preview eight columns">
                <div class="preview-colors d-flex" style="height: 2em; border: 1px solid #ccc;">
                    <div 
                        class="flex-grow-1 preview-color-segment" 
                        v-for="(color, index) in localScheme.colors" 
                        :key="index"
                        :style="`background-color: ${color};`"
                        :title="$t(localScheme.categories[index])"
                    ></div>
                </div>
            </div>
        </div>

        <div class="srow mt-4">
            <div class="button-group eight columns">
                <button 
                    class="button-primary" 
                    @click="saveScheme" 
                    :disabled="!isValid"
                >
                    {{ isEditMode ? $t('updateScheme') : $t('createCustomScheme') }}
                </button>
                <button 
                    class="button-secondary" 
                    @click="resetToDefaults"
                >
                    {{ $t('resetToDefaults') }}
                </button>
                <button 
                    class="button-secondary" 
                    @click="cancelEdit"
                >
                    {{ $t('cancel') }}
                </button>
                <button 
                    v-if="isEditMode && localScheme.isCustom" 
                    class="button-danger" 
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
import { customColorSchemeService } from '../../js/service/customColorSchemeService';
import { i18nService } from '../../js/service/i18nService';

export default {
    name: 'CustomColorSchemeEditor',
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
            localScheme: null,
            selectedBaseScheme: 'FITZGERALD',
            nameError: '',
            isEditMode: false,
            originalScheme: null
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
                
                // Determine base scheme type
                if (scheme.categories === constants.CS_GOOSSENS_CATEGORIES) {
                    this.selectedBaseScheme = 'GOOSENS';
                } else if (scheme.categories === constants.CS_MONTESSORI_CATEGORIES) {
                    this.selectedBaseScheme = 'MONTESSORI';
                } else {
                    this.selectedBaseScheme = 'FITZGERALD';
                }
            } else {
                // Create mode
                this.isEditMode = false;
                this.originalScheme = null;
                this.createNewScheme();
            }
        },
        
        createNewScheme() {
            this.localScheme = constants.createCustomColorScheme('New Theme', this.selectedBaseScheme);
        },
        
        onBaseSchemeChange() {
            if (!this.isEditMode) {
                this.createNewScheme();
            }
        },
        
        updateColor(index, color) {
            if (this.localScheme && this.localScheme.colors && index < this.localScheme.colors.length) {
                this.$set(this.localScheme.colors, index, color);
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
                if (!customColorSchemeService.isNameAvailable(this.localScheme.displayName, this.metadata)) {
                    this.nameError = this.$t('schemeNameAlreadyExists');
                }
            }
        },
        
        resetToDefaults() {
            if (this.isEditMode && this.originalScheme) {
                this.localScheme = JSON.parse(JSON.stringify(this.originalScheme));
            } else {
                this.createNewScheme();
            }
            this.nameError = '';
        },
        
        async saveScheme() {
            try {
                this.validateName();
                if (this.nameError) {
                    return;
                }
                
                // Update the scheme name based on display name
                if (!this.isEditMode || this.localScheme.displayName !== this.originalScheme.displayName) {
                    this.localScheme.name = constants.COLOR_SCHEME_CUSTOM_PREFIX + '_' + 
                                           this.localScheme.displayName.toUpperCase().replace(/\s+/g, '_');
                }
                
                await customColorSchemeService.saveCustomScheme(this.localScheme, this.metadata);
                this.$emit('scheme-saved', this.localScheme);
                
            } catch (error) {
                console.error('Error saving custom color scheme:', error);
                this.$emit('error', error.message || this.$t('errorSavingScheme'));
            }
        },
        
        async deleteScheme() {
            if (!this.isEditMode || !this.localScheme.isCustom) {
                return;
            }
            
            if (!confirm(this.$t('confirmDeleteScheme', [this.localScheme.displayName]))) {
                return;
            }
            
            try {
                await customColorSchemeService.deleteCustomScheme(this.localScheme.name, this.metadata);
                this.$emit('scheme-deleted', this.localScheme.name);
            } catch (error) {
                console.error('Error deleting custom color scheme:', error);
                this.$emit('error', error.message || this.$t('errorDeletingScheme'));
            }
        },
        
        cancelEdit() {
            this.$emit('cancel');
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

.color-preview-box {
    width: 100%;
    height: 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.preview-color-segment {
    border-right: 1px solid #fff;
}

.preview-color-segment:last-child {
    border-right: none;
}

.button-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
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
</style>
