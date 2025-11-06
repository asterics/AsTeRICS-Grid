<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.esc="$emit('close')" @keydown.ctrl.enter="exportLabels()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1>{{ $t('exportElementLabels') }}</h1>
                    </div>

                    <div class="modal-body">
                        <p>{{ $t('exportLabelsDescription') }}</p>

                        <div class="srow">
                            <label for="languageSelect">{{ $t('selectLanguage') }}</label>
                            <select id="languageSelect" v-model="selectedLanguage" class="eight columns">
                                <option v-for="lang in availableLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                            </select>
                        </div>

                        <div class="srow">
                            <label for="sortOrder">{{ $t('sortOrder') }}</label>
                            <select id="sortOrder" v-model="sortOrder" class="eight columns">
                                <option value="alphabetical">{{ $t('alphabetically') }}</option>
                                <option value="byGrid">{{ $t('byGrid') }}</option>
                            </select>
                        </div>

                        <div class="srow">
                            <input type="checkbox" id="includeGridNames" v-model="includeGridNames"/>
                            <label for="includeGridNames">{{ $t('includeGridNames') }}</label>
                        </div>

                        <div class="srow">
                            <input type="checkbox" id="removeDuplicates" v-model="removeDuplicates"/>
                            <label for="removeDuplicates">{{ $t('removeDuplicateLabels') }}</label>
                        </div>

                        <div class="srow mt-4">
                            <label>{{ $t('preview') }}:</label>
                            <textarea readonly rows="10" class="twelve columns" :value="previewText" style="font-family: monospace; background-color: #f5f5f5;"></textarea>
                            <small style="color: #666;">{{ labelCount }} {{ $t('labels') }}</small>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="four columns" @click="exportLabels()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-download"/> <span>{{ $t('exportToFile') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {dataService} from "../../js/service/data/dataService";
    import {util} from "../../js/util/util";
    import './../../css/modal.css';

    export default {
        props: ['gridsData'],
        data: function () {
            return {
                selectedLanguage: i18nService.getContentLang(),
                availableLanguages: i18nService.getAllLanguages(),
                sortOrder: 'alphabetical',
                includeGridNames: true,
                removeDuplicates: false,
                allLabels: []
            }
        },
        computed: {
            previewText() {
                return this.generateLabelText();
            },
            labelCount() {
                return this.allLabels.length;
            }
        },
        methods: {
            generateLabelText() {
                let grids = this.gridsData || [];
                this.allLabels = [];
                let output = '';

                if (this.sortOrder === 'byGrid') {
                    // Group by grid
                    for (let grid of grids) {
                        let gridLabel = i18nService.getTranslation(grid.label, {lang: this.selectedLanguage});
                        let gridLabels = [];

                        for (let element of grid.gridElements) {
                            let label = this.getElementLabel(element);
                            if (label) {
                                gridLabels.push(label);
                            }
                        }

                        if (gridLabels.length > 0) {
                            gridLabels.sort((a, b) => a.localeCompare(b));

                            if (this.includeGridNames) {
                                output += `\n=== ${gridLabel} ===\n`;
                            }
                            output += gridLabels.join('\n') + '\n';
                            this.allLabels.push(...gridLabels);
                        }
                    }
                } else {
                    // Alphabetical - collect all labels first
                    for (let grid of grids) {
                        for (let element of grid.gridElements) {
                            let label = this.getElementLabel(element);
                            if (label) {
                                this.allLabels.push(label);
                            }
                        }
                    }

                    if (this.removeDuplicates) {
                        this.allLabels = [...new Set(this.allLabels)];
                    }

                    this.allLabels.sort((a, b) => a.localeCompare(b));
                    output = this.allLabels.join('\n');
                }

                return output.trim();
            },
            getElementLabel(element) {
                if (!element.label) return null;

                let label = '';
                if (typeof element.label === 'string') {
                    label = element.label;
                } else if (typeof element.label === 'object') {
                    label = i18nService.getTranslation(element.label, {lang: this.selectedLanguage});
                }

                return label ? label.trim() : null;
            },
            exportLabels() {
                let text = this.generateLabelText();
                let filename = `grid-labels-${this.selectedLanguage}-${Date.now()}.txt`;

                // Create and download file
                let blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();

                this.$emit('close');
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    .mt-4 {
        margin-top: 2em;
    }
</style>
