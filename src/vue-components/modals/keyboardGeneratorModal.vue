<template>
  <div class="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="generate">
          <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
          <div class="modal-header">
            <h1>{{ $t('generate') || 'Generate keyboard' }}</h1>
          </div>

          <div class="modal-body">
            <div v-if="errorMsg" class="srow" style="color:#b00020;">
              {{ errorMsg }}
            </div>
            <div class="srow">
              <label class="three columns" for="langSel">Language</label>
              <select id="langSel" class="nine columns" v-model="langCode" @change="onLangChange">
                <option v-for="opt in codeOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
              </select>
            </div>

            <div class="srow">
              <label class="three columns" for="scriptSel">Script</label>
              <select id="scriptSel" class="nine columns" v-model="script" @change="onScriptChange">
                <option :value="undefined">(auto)</option>
                <option v-for="opt in scriptOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <!-- Layout source: Generated vs Official -->
            <div class="srow">
              <label class="three columns">{{ $t('layoutSource') || 'Layout source' }}</label>
              <div class="nine columns">
                <label><input type="radio" value="generated" v-model="layoutSource"> {{ $t('generated') || 'Generated' }}</label>
                <label style="margin-left:1em;"><input type="radio" value="official" v-model="layoutSource"> {{ $t('officialLayout') || 'Official keyboard layout' }}</label>
              </div>
            </div>

            <!-- Official layout template selection and options -->
            <div v-if="layoutSource==='official'" class="srow">
              <label class="three columns" for="templateSel">{{ $t('template') || 'Template' }}</label>
              <div class="nine columns">
                <select id="templateSel" v-model="selectedLayoutId">
                  <option v-for="opt in templateOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
                </select>
                <div v-if="templateOptions.length===0" style="margin-top:0.5em; color:#666;">
                  {{ $t('noTemplatesForLanguage') || 'No official layouts available for this language.' }}
                </div>
              </div>
            </div>

            <!-- Layer selection for official layouts -->
            <div v-if="layoutSource==='official'" class="srow">
              <label class="three columns" for="layerSel">{{ $t('keyLayer') || 'Layer' }}</label>
              <div class="nine columns">
                <select id="layerSel" v-model="layer">
                  <option value="base">{{ $t('layer_base') || 'Base' }}</option>
                  <option value="shift">{{ $t('layer_shift') || 'Shift' }}</option>
                  <option value="caps">{{ $t('layer_caps') || 'Caps' }}</option>
                  <option value="altgr">{{ $t('layer_altgr') || 'AltGr' }}</option>
                  <option value="shift_altgr">{{ $t('layer_shift_altgr') || 'Shift+AltGr' }}</option>
                  <option value="ctrl">{{ $t('layer_ctrl') || 'Ctrl' }}</option>
                  <option value="alt">{{ $t('layer_alt') || 'Alt' }}</option>
                </select>
              </div>
            </div>


            <div class="srow">
              <label class="three columns">{{ $t('letterCase') }}</label>
              <div class="nine columns">
                <label><input type="radio" value="lower" v-model="letterCase" :disabled="layoutSource==='official' && layer!=='base'"> {{ $t('lowercase') }}</label>
                <label style="margin-left:1em;"><input type="radio" value="upper" v-model="letterCase" :disabled="!supportsUppercase || (layoutSource==='official' && layer!=='base')"> {{ $t('uppercase') }}</label>
              </div>
            </div>

            <div v-if="layoutSource==='official'" class="srow">
              <input id="hideNumberRow" type="checkbox" v-model="hideNumberRow">
              <label for="hideNumberRow">{{ $t('hideNumberRow') || 'Hide number row' }}</label>
              <span style="margin-left:1em"></span>
              <input id="hidePunctuation" type="checkbox" v-model="hidePunctuation">
              <label for="hidePunctuation">{{ $t('hidePunctuation') || 'Hide punctuation' }}</label>
            </div>

            <!-- Generated options -->
            <div class="srow">
              <label class="three columns">Ordering</label>
              <div class="nine columns">
                <label v-if="supportsFrequency"><input type="radio" value="frequency" v-model="order" :disabled="layoutSource==='official'"> Frequency-based</label>
                <label style="margin-left:1em;"><input type="radio" value="alphabetical" v-model="order" :disabled="layoutSource==='official'"> Alphabetical</label>
              </div>
            </div>

            <div class="srow">
              <label class="three columns">Layout</label>
              <div class="nine columns">
                <input class="two columns" type="number" min="1" v-model.number="rows" placeholder="rows" :disabled="layoutSource==='official'">
                <span class="one columns" style="text-align:center;">×</span>
                <input class="two columns" type="number" min="1" v-model.number="cols" placeholder="cols" :disabled="layoutSource==='official'">
                <span class="six columns">(leave empty for auto)</span>
              </div>
            </div>

            <div class="srow" v-if="supportsDigits">
              <input id="includeDigits" type="checkbox" v-model="includeDigits" :disabled="layoutSource==='official'">
              <label for="includeDigits">Include digits</label>
            </div>

            <div class="srow">
              <input id="twoHit" type="checkbox" v-model="twoHit" :disabled="layoutSource==='official'">
              <label for="twoHit">Two-hit layout (split into two pages when possible)</label>
            </div>

            <div class="srow">
              <label class="three columns" for="labelIn">Label</label>
              <input id="labelIn" class="nine columns" v-model="gridLabel" :placeholder="defaultLabel">
            </div>

          </div>

          <div class="modal-footer">
            <div class="button-container srow">
              <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
              </button>
              <button class="four columns" @click="generate" :disabled="!canGenerate || loading">
                <i v-if="!loading" class="fas fa-check"/>
                <i v-else class="fas fa-spinner fa-spin"/>
                <span>Generate</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import './../../css/modal.css';
import { keyboardGeneratorService } from '../../js/service/keyboardGeneratorService';
import { dataService } from '../../js/service/data/dataService';


import { i18nService } from '../../js/service/i18nService';

export default {
  data() {
    return {
      loading: false,
      errorMsg: '',
      codes: [],
      codeOptions: [],
      scripts: [],
      scriptOptions: [],
      langCode: '',
      script: undefined,
      layoutSource: 'generated',
      templateOptions: [],
      selectedLayoutId: '',
      layer: 'base',

      order: 'frequency',
      includeDigits: false,
      twoHit: false,
      letterCase: 'lower',
      hideNumberRow: false,
      hidePunctuation: false,
      supportsDigits: false,
      supportsFrequency: false,
      supportsUppercase: false,
      rows: null,
      cols: null,
      gridLabel: '',
    }
  },
  computed: {
    defaultLabel() {
      if (this.layoutSource === 'official') {
        return `Keyboard ${this.selectedLayoutId || (this.langCode || '')}${this.letterCase==='upper' ? ' (UPPER)' : ''}`;
      }
      return `Keyboard ${this.langCode || ''}${this.script ? '-' + this.script : ''} (${this.order})`;
    },
    canGenerate() {
      if (!this.langCode) return false;
      if (this.layoutSource === 'official') {
        return !!this.selectedLayoutId;
      }
      return true;
    }
  },
  watch: {
    layoutSource() {
      // No-op; keep selection when switching back and forth
    }
  },
  methods: {
    bcpTag(code) {
      if (!code) return code;
      const parts = code.split('-');
      if (parts.length === 2) {
        const p1 = parts[0];
        const p2 = parts[1];
        if (p2.length === 2) return `${p1}-${p2.toUpperCase()}`;
        if (p2.length === 4) return `${p1}-${p2[0].toUpperCase()}${p2.slice(1).toLowerCase()}`;
      }
      return code;
    },
    langDisplay(code) {
      try {
        const byI18n = i18nService.getLangReadable && i18nService.getLangReadable(code);
        if (byI18n && typeof byI18n === 'string' && byI18n.trim()) return `${byI18n} (${code})`;
      } catch (e) {}
      try {
        if (window.Intl && Intl.DisplayNames) {
          const ui = (i18nService.getAppLang && i18nService.getAppLang()) || navigator.language || 'en';
          const dn = new Intl.DisplayNames([ui], { type: 'language' });
          const name = dn.of(this.bcpTag(code));
          if (name) return `${name} (${code})`;
        }
      } catch (e) {}
      return code;
    },
    scriptDisplay(s) {
      if (!s) return s;
      try {
        if (window.Intl && Intl.DisplayNames) {
          const ui = (i18nService.getAppLang && i18nService.getAppLang()) || navigator.language || 'en';
          const dn = new Intl.DisplayNames([ui], { type: 'script' });
          const name = dn.of(s[0].toUpperCase() + s.slice(1).toLowerCase());
          if (name) return `${name} (${s})`;
        }
      } catch (e) {}
      return s;
    },
    buildLangOptions() {
      this.codeOptions = (this.codes || []).map(c => ({ code: c, label: this.langDisplay(c) }))
        .sort((a,b) => (''+a.label).localeCompare(b.label));
    },
    buildScriptOptions() {
      this.scriptOptions = (this.scripts || []).map(s => ({ value: s, label: this.scriptDisplay(s) }))
        .sort((a,b) => (''+a.label).localeCompare(b.label));
    },
    async loadCodes() {
      this.codes = await keyboardGeneratorService.getAvailableCodes();
      this.buildLangOptions();
      const current = i18nService.getContentLang && i18nService.getContentLang();
      if (current && this.codes.includes(current)) this.langCode = current; else this.langCode = this.codes[0] || '';
      await this.onLangChange();
      await this.checkCapabilities();
    },
    async loadTemplates() {
      try {
        this.templateOptions = await keyboardGeneratorService.getAvailableTemplates(this.langCode, this.script);
        if (!this.selectedLayoutId || !this.templateOptions.find(t => t.id === this.selectedLayoutId)) {
          this.selectedLayoutId = (this.templateOptions[0] && this.templateOptions[0].id) || '';
        }
      } catch (e) {
        this.templateOptions = [];
        this.selectedLayoutId = '';
      }
    },
    async onLangChange() {
      if (!this.langCode) { this.scripts = []; this.scriptOptions = []; this.script = undefined; this.supportsDigits=false; this.supportsFrequency=false; return; }
      this.scripts = await keyboardGeneratorService.getScripts(this.langCode);
      this.buildScriptOptions();
      if (!this.scripts || this.scripts.length === 0) this.script = undefined;
      await this.checkCapabilities();
      await this.loadTemplates();
    },
    async onScriptChange() {
      await this.checkCapabilities();
      await this.loadTemplates();
    },
    async checkCapabilities() {
      try {
        this.supportsDigits = await keyboardGeneratorService.supportsDigits(this.langCode, this.script);
      } catch (e) { this.supportsDigits = false; }
      try {
        this.supportsFrequency = await keyboardGeneratorService.supportsFrequency(this.langCode);
      } catch (e) { this.supportsFrequency = false; }
      try {
        this.supportsUppercase = await keyboardGeneratorService.supportsUppercase(this.langCode, this.script);
      } catch (e) { this.supportsUppercase = false; }
      if (!this.supportsFrequency && this.order === 'frequency') this.order = 'alphabetical';
      if (!this.supportsUppercase && this.letterCase === 'upper') this.letterCase = 'lower';
    },
    async generate() {
      if (!this.langCode) return;
      this.loading = true;
      this.errorMsg = '';
      try {
        let grids;
        if (this.layoutSource === 'official') {
          if (!this.selectedLayoutId) throw new Error('No template selected.');
          grids = await keyboardGeneratorService.generateFromTemplate({
            layoutId: this.selectedLayoutId,
            langCode: this.langCode,
            script: this.script,
            letterCase: this.letterCase,
            hideNumberRow: this.hideNumberRow,
            hidePunctuation: this.hidePunctuation,
            gridLabel: this.gridLabel || this.defaultLabel,
            layer: this.layer,
          });
        } else {
          grids = await keyboardGeneratorService.generateKeyboardGrids({
            langCode: this.langCode,
            script: this.script,
            order: this.order,
            includeDigits: this.includeDigits,
            gridLabel: this.gridLabel || this.defaultLabel,
            rows: this.rows || undefined,
            cols: this.cols || undefined,
            twoHit: this.twoHit,
            letterCase: this.letterCase,
          });
        }
        for (const g of grids) {
          // Save sequentially to preserve order and avoid overwhelming storage
          // eslint-disable-next-line no-await-in-loop
          await dataService.saveGrid(g);
        }
        this.$emit('created', grids[0].id);
        this.$emit('close');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Keyboard generation failed', e);
        this.errorMsg = (e && e.message) ? e.message : 'Keyboard generation failed.';
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.loadCodes();
  }
}
</script>

<style scoped>
.srow { margin-top: 1em; }
</style>

