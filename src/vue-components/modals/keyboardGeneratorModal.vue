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
            <div class="srow">
              <label class="three columns" for="langSel">Language</label>
              <select id="langSel" class="nine columns" v-model="langCode" @change="onLangChange">
                <option v-for="opt in codeOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
              </select>
            </div>

            <div class="srow">
              <label class="three columns" for="scriptSel">Script</label>
              <select id="scriptSel" class="nine columns" v-model="script">
                <option :value="undefined">(auto)</option>
                <option v-for="opt in scriptOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <div class="srow">
              <label class="three columns">Ordering</label>
              <div class="nine columns">
                <label><input type="radio" value="frequency" v-model="order"> Frequency-based</label>
                <label style="margin-left:1em;"><input type="radio" value="alphabetical" v-model="order"> Alphabetical</label>
              </div>
            </div>

            <div class="srow">
              <label class="three columns" for="labelIn">Label</label>
              <input id="labelIn" class="nine columns" v-model="gridLabel" :placeholder="defaultLabel">
            </div>

            <div class="srow">
              <label class="three columns">Layout</label>
              <div class="nine columns">
                <input class="two columns" type="number" min="1" v-model.number="rows" placeholder="rows">
                <span class="one columns" style="text-align:center;">×</span>
                <input class="two columns" type="number" min="1" v-model.number="cols" placeholder="cols">
                <span class="six columns">(leave empty for auto)</span>
              </div>
            </div>

            <div class="srow">
              <input id="includeDigits" type="checkbox" v-model="includeDigits">
              <label for="includeDigits">Include digits</label>
            </div>

          </div>

          <div class="modal-footer">
            <div class="button-container srow">
              <button class="four columns offset-by-four" @click="$emit('close')" :title="$t('keyboardEsc')">
                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
              </button>
              <button class="four columns" @click="generate" :disabled="!langCode || loading">
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
      codes: [],
      codeOptions: [],
      scripts: [],
      scriptOptions: [],
      langCode: '',
      script: undefined,
      order: 'frequency',
      includeDigits: false,
      rows: null,
      cols: null,
      gridLabel: '',
    }
  },
  computed: {
    defaultLabel() {
      return `Keyboard ${this.langCode || ''}${this.script ? '-' + this.script : ''} (${this.order})`;
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
    },
    async onLangChange() {
      if (!this.langCode) { this.scripts = []; this.scriptOptions = []; this.script = undefined; return; }
      this.scripts = await keyboardGeneratorService.getScripts(this.langCode);
      this.buildScriptOptions();
      if (!this.scripts || this.scripts.length === 0) this.script = undefined;
    },
    async generate() {
      if (!this.langCode) return;
      this.loading = true;
      try {
        const grid = await keyboardGeneratorService.generateKeyboardGrid({
          langCode: this.langCode,
          script: this.script,
          order: this.order,
          includeDigits: this.includeDigits,
          gridLabel: this.gridLabel || this.defaultLabel,
          rows: this.rows || undefined,
          cols: this.cols || undefined,
        });
        await dataService.saveGrid(grid);
        this.$emit('created', grid.id);
        this.$emit('close');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Keyboard generation failed', e);
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

