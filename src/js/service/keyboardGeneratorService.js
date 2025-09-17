import { GridData } from '../model/GridData';
import { GridElement } from '../model/GridElement';
import { i18nService } from './i18nService';
import * as WA from 'worldalphabets';

async function getAvailableCodes() {
  return WA.getAvailableCodes ? WA.getAvailableCodes() : [];
}

async function getScripts(langCode) {
  try {
    if (WA.getScripts) return await WA.getScripts(langCode);
    if (WA.getLanguage) {
      const lang = await WA.getLanguage(langCode);
      return lang && lang.scripts ? lang.scripts : [];
    }
  } catch (e) {}
  return [];
}

function toLocaleTag(langCode, script) {
  // Build BCP-47 tag with script subtag when provided (e.g., sr-Cyrl)
  if (script && typeof script === 'string' && script.length >= 4) {
    const scriptTag = script[0].toUpperCase() + script.slice(1).toLowerCase();
    return `${langCode}-${scriptTag}`;
  }
  return langCode;
}

async function getCharacters(langCode, script, { includeDigits = false } = {}) {
  let lower = [];
  if (WA.getLowercase) {
    lower = await WA.getLowercase(langCode, script);
  } else if (WA.getLanguage) {
    const lang = await WA.getLanguage(langCode);
    const alph = lang && lang.alphabet ? lang.alphabet : {};
    lower = alph.lowercase || alph.lower || alph.base || [];
  }
  let chars = Array.isArray(lower) ? lower.slice() : [];
  const seen = new Set();
  chars = chars.filter((c) => typeof c === 'string' && c.length > 0 && !seen.has(c) && seen.add(c));

  if (includeDigits) {
    try {
      let digitList = [];
      if (WA.getDigits) {
        const digits = await WA.getDigits(langCode, script);
        digitList = Array.isArray(digits) ? digits : (typeof digits === 'object' && digits ? Object.values(digits) : []);
      } else if (WA.getLanguage) {
        const lang = await WA.getLanguage(langCode);
        digitList = lang && Array.isArray(lang.digits) ? lang.digits : [];
      }
      for (const d of digitList) {
        if (typeof d === 'string' && d.length > 0 && !seen.has(d)) {
          seen.add(d);
          chars.push(d);
        }
      }
    } catch (e) {}
  }
  return chars;
}

async function orderCharacters(langCode, chars, order, script) {
  if (order === 'frequency') {
    try {
      let freqMap = {};
      if (WA.getFrequency) {
        freqMap = await WA.getFrequency(langCode);
      } else if (WA.getLanguage) {
        const lang = await WA.getLanguage(langCode);
        freqMap = (lang && lang.frequency) || {};
      }
      const getF = (c) => {
        const key = (c || '').toLowerCase();
        return typeof freqMap?.[key] === 'number' ? freqMap[key] : 0;
      };
      return chars.slice().sort((a, b) => getF(b) - getF(a));
    } catch (e) {
      // fallback to alphabetical if frequency absent
    }
  }
  const collator = new Intl.Collator(toLocaleTag(langCode, script), { usage: 'sort', sensitivity: 'base', numeric: false });
  return chars.slice().sort((a, b) => collator.compare(a, b));
}

function computeGridDims(n, rows, cols) {
  if (rows && cols) return { rows, cols };
  if (cols && !rows) return { cols, rows: Math.ceil(n / cols) };
  if (rows && !cols) return { rows, cols: Math.ceil(n / rows) };
  const approxCols = Math.max(3, Math.min(12, Math.ceil(Math.sqrt(n))));
  return { cols: approxCols, rows: Math.ceil(n / approxCols) };
}

async function generateKeyboardGrid({
  langCode,
  script = undefined,
  order = 'frequency', // 'frequency' | 'alphabetical'
  includeDigits = false,
  gridLabel = null,
  rows = null,
  cols = null,
} = {}) {
  if (!langCode) throw new Error('langCode is required');
  const charsRaw = await getCharacters(langCode, script, { includeDigits });
  const chars = await orderCharacters(langCode, charsRaw, order, script);

  const { rows: R, cols: C } = computeGridDims(chars.length, rows, cols);

  const label = gridLabel || `Keyboard ${langCode}${script ? '-' + script : ''} (${order})`;
  const grid = new GridData({
    label: i18nService.getTranslationObject(label),
    gridElements: [],
    rowCount: R,
    minColumnCount: C,
    keyboardMode: GridData.KEYBOARD_ENABLED,
  });

  let i = 0;
  for (const ch of chars) {
    const x = i % C;
    const y = Math.floor(i / C);
    grid.gridElements.push(
      new GridElement({
        label: i18nService.getTranslationObject(ch),
        x,
        y,
        width: 1,
        height: 1,
      })
    );
    i += 1;
  }
  return grid;
}

async function supportsDigits(langCode, script) {
  try {
    if (WA.getDigits) {
      const res = await WA.getDigits(langCode, script);
      if (Array.isArray(res)) return res.length > 0;
      if (res && typeof res === 'object') return Object.values(res).length > 0;
      return false;
    }
    if (WA.getLanguage) {
      const lang = await WA.getLanguage(langCode);
      return !!(lang && Array.isArray(lang.digits) && lang.digits.length > 0);
    }
  } catch (e) {}
  return false;
}

async function supportsFrequency(langCode) {
  try {
    if (WA.getFrequency) {
      const res = await WA.getFrequency(langCode);
      return !!(res && typeof res === 'object' && Object.keys(res).length > 0);
    }
    if (WA.getLanguage) {
      const lang = await WA.getLanguage(langCode);
      return !!(lang && lang.frequency && Object.keys(lang.frequency).length > 0);
    }
  } catch (e) {}
  return false;
}

export const keyboardGeneratorService = {
  getAvailableCodes,
  getScripts,
  generateKeyboardGrid,
  supportsDigits,
  supportsFrequency,
};

