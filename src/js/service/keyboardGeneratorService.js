import { GridData } from '../model/GridData';
import { GridElement } from '../model/GridElement';
import { GridActionNavigate } from '../model/GridActionNavigate';
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
function computePageDims(n, rows, cols) {
  if (rows && cols) return { rows, cols };
  if (rows && !cols) return { rows, cols: 10 };
  if (!rows && cols) return { rows: 8, cols };
  return { rows: 8, cols: 10 };
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function generateKeyboardGrids({
  langCode,
  script = undefined,
  order = 'frequency',
  includeDigits = false,
  gridLabel = null,
  rows = null,
  cols = null,
  twoHit = false,
} = {}) {
  if (!langCode) throw new Error('langCode is required');
  const charsRaw = await getCharacters(langCode, script, { includeDigits });
  if (!charsRaw || charsRaw.length === 0) {
    throw new Error('No characters available for the selected language/script.');
  }
  const chars = await orderCharacters(langCode, charsRaw, order, script);

  const labelBase = gridLabel || `Keyboard ${langCode}${script ? '-' + script : ''} (${order})`;

  const { rows: R, cols: C } = computePageDims(chars.length, rows, cols);
  if (!R || !C || R < 1 || C < 1) throw new Error('Invalid grid dimensions');

  const capacityFull = R * C;
  if (chars.length <= capacityFull) {
    const grid = new GridData({
      label: i18nService.getTranslationObject(labelBase),
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
    return [grid];
  }

  // Two-hit: try to fit into 2 pages; if still too big, fall back to regular pagination
  if (twoHit && chars.length <= capacityFull * 2) {
    const mid = Math.ceil(chars.length / 2);
    const halves = [chars.slice(0, mid), chars.slice(mid)];
    const grids = halves.map((chunk, idx) => {
      const label = `${labelBase} [${idx + 1}/2]`;
      return new GridData({
        label: i18nService.getTranslationObject(label),
        gridElements: [],
        rowCount: R,
        minColumnCount: C,
        keyboardMode: GridData.KEYBOARD_ENABLED,
      });
    });
    // Link pages and fill content
    halves.forEach((chunk, idx) => {
      const grid = grids[idx];
      const hasPrev = idx > 0;
      const hasNext = idx < grids.length - 1;
      if (hasPrev) {
        grid.gridElements.push(new GridElement({
          label: i18nService.getTranslationObject('Prev'), x: 0, y: 0, width: 1, height: 1,
          actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_GRID, toGridId: grids[idx - 1].id })],
        }));
      }
      if (hasNext) {
        grid.gridElements.push(new GridElement({
          label: i18nService.getTranslationObject('More'), x: 1, y: 0, width: 1, height: 1,
          actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_GRID, toGridId: grids[idx + 1].id })],
        }));
      }
      let placed = 0;
      for (let y = 0; y < R; y++) {
        for (let x = 0; x < C; x++) {
          if ((hasPrev && x === 0 && y === 0) || (hasNext && x === 1 && y === 0)) continue;
          if (placed >= chunk.length) break;
          const ch = chunk[placed++];
          grid.gridElements.push(new GridElement({ label: i18nService.getTranslationObject(ch), x, y, width: 1, height: 1 }));
        }
      }
    });
    return grids;
  }

  const conservativeCapacity = Math.max(1, capacityFull - 2);
  const chunks = chunkArray(chars, conservativeCapacity);

  const grids = chunks.map((chunk, idx) => {
    const label = `${labelBase} [${idx + 1}/${chunks.length}]`;
    return new GridData({
      label: i18nService.getTranslationObject(label),
      gridElements: [],
      rowCount: R,
      minColumnCount: C,
      keyboardMode: GridData.KEYBOARD_ENABLED,
    });
  });

  grids.forEach((grid, idx) => {
    const hasPrev = idx > 0;
    const hasNext = idx < grids.length - 1;

    if (hasPrev) {
      grid.gridElements.push(
        new GridElement({
          label: i18nService.getTranslationObject('Prev'),
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_GRID, toGridId: grids[idx - 1].id })],
        })
      );
    }
    if (hasNext) {
      grid.gridElements.push(
        new GridElement({
          label: i18nService.getTranslationObject('More'),
          x: 1,
          y: 0,
          width: 1,
          height: 1,
          actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_GRID, toGridId: grids[idx + 1].id })],
        })
      );
    }

    const chunk = chunks[idx];
    let placed = 0;
    for (let y = 0; y < R; y++) {
      for (let x = 0; x < C; x++) {
        if ((hasPrev && x === 0 && y === 0) || (hasNext && x === 1 && y === 0)) continue;
        if (placed >= chunk.length) break;
        const ch = chunk[placed++];
        grid.gridElements.push(
          new GridElement({
            label: i18nService.getTranslationObject(ch),
            x,
            y,
            width: 1,
            height: 1,
          })
        );
      }
    }
  });

  return grids;
}


async function generateKeyboardGrid(opts = {}) {
  const pages = await generateKeyboardGrids(opts);
  return pages[0];
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
  generateKeyboardGrids,
  generateKeyboardGrid,
  supportsDigits,
  supportsFrequency,
};

