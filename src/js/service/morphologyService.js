import $ from '../externals/jquery.js';
import { i18nService } from './i18nService.js';
import { util } from '../util/util.js';
import { dataService } from './data/dataService.js';
import { constants } from '../util/constants.js';
import { morph, configureMorphRuntime, configureMorphHfst, configureTagOrdering } from '@morphgrid/core';

// Safe wrapper around @morphgrid/core. Dev uses node_modules URLs; prod should copy assets into app/build.
let _enabled = false;
let _tagOrder = 'flexible';
let _convertMode = null;
let _apiConfigured = false;
let _langLoaded = {};
let _langTested = {}; // Track which languages have been tested to avoid spam
let _cache = new Map();

async function refreshMetadata() {
  const metadata = await dataService.getMetadata();
  _enabled = !!metadata.activateAutoMorphology;
  _tagOrder = metadata.morphTagOrder || 'flexible';
  _convertMode = (metadata.textConfig || {}).convertMode;
  try { configureTagOrdering && configureTagOrdering(_tagOrder); } catch (e) {}
}

$(document).on(constants.EVENT_METADATA_UPDATED, refreshMetadata);
$(document).on(constants.EVENT_USER_CHANGED, refreshMetadata);

function isEnabled() {
  return _enabled;
}

function normLang(lang) {
  return lang || i18nService.getContentLang();
}

function preserveCase(original, transformed) {
  if (!original || !transformed) return transformed;
  if (original === original.toUpperCase()) {
    return transformed.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return transformed[0].toUpperCase() + transformed.slice(1).toLowerCase();
  }
  return transformed.toLowerCase();
}

async function ensureApi() {
  if (_apiConfigured) return true;
  try {
    configureMorphRuntime('hfst');
    // Dev: serve directly from node_modules; our devServer sets correct MIME for .wasm
    configureMorphHfst({
      wasmUrl: '/node_modules/@morphgrid/core/public/wasm/hfst.js',
      packUrl: '/node_modules/@morphgrid/packs/'
    });
    configureTagOrdering && configureTagOrdering(_tagOrder || 'flexible');
    _apiConfigured = true;
    return true;
  } catch (e) {
    _apiConfigured = false;
    return false;
  }
}

async function ensureLanguage(lang) {
  const ok = await ensureApi();
  if (!ok) return false;
  const useLang = normLang(lang);
  const baseLang = i18nService.getBaseLang ? i18nService.getBaseLang(useLang) : useLang;

  if (_langLoaded[baseLang]) {
    return true; // Don't log repeatedly
  }

  console.log('🔧 ensureLanguage: Loading new language pack for:', baseLang);

  try {
    console.log('🔧 Loading language pack for:', baseLang);
    await morph.load(baseLang);
    _langLoaded[baseLang] = true;
    console.log('🔧 Successfully loaded language pack:', baseLang);

    // Test if the pack has join rules (library now handles language code normalization)
    try {
      const testJoin = await morph.join('le', 'ami', baseLang);
      console.log('🔧 Post-load test join le + ami:', testJoin);
    } catch (testError) {
      console.log('🔧 Post-load test join failed:', testError);
    }

    return true;
  } catch (e) {
    console.log('🔧 Failed to load language pack:', baseLang, e);
    return false;
  }
}

// Tag mapping split into its own module for easy testing
import { mapTagsToMorph } from './morphologyTagMap.js';

function getLemma(element, lang) {
  const l = normLang(lang);
  const baseLang = i18nService.getBaseLang(l);
  const forms = element.wordForms || [];
  const baseForLang = forms.find(
    (f) => f && Array.isArray(f.tags) && f.tags.includes(constants.WORDFORM_TAG_BASE) && (f.lang === l || (f.lang && i18nService.getBaseLang(f.lang) === baseLang))
  );
  if (baseForLang && baseForLang.value) return baseForLang.value;
  const lbl = i18nService.getTranslation(element.label, { lang: l }) || i18nService.getTranslation(element.label);
  return lbl || null;
}

async function maybeUpdateElementText(element, tags, lang) {
  if (!_enabled || !element) return;
  const l = normLang(lang);
  const baseLang = i18nService.getBaseLang ? i18nService.getBaseLang(l) : l;
  const key = `${element.id}|${baseLang}|${JSON.stringify(tags || [])}`;
  if (_cache.has(key)) return;
  const lemma = getLemma(element, l);
  if (!lemma) return;
  const ok = await ensureLanguage(baseLang);
  if (!ok) return;
  try {
    const mtags = mapTagsToMorph(tags, baseLang);
    if (!mtags.length) return;
    const forms = await morph.generate({ lemma, tags: mtags }, baseLang);
    const value = Array.isArray(forms) ? (forms[0] && (forms[0].value || forms[0])) : null;
    if (value) {
      _cache.set(key, value);
      const text = util.convertLowerUppercase(value, _convertMode);
      $(document).trigger(constants.EVENT_ELEM_TEXT_CHANGED, [element.id, text]);
    }
  } catch (e) {
    // no-op
  }
}

async function smartJoinTextArray(textArray, lang) {
  try {
    const l = normLang(lang);
    const baseLang = i18nService.getBaseLang ? i18nService.getBaseLang(l) : l;
    const ok = await ensureLanguage(l);
    if (!ok || !Array.isArray(textArray) || textArray.length === 0) return (textArray || []).join(' ');

    // Only log when we actually have text to process
    if (textArray.length > 1) {
      console.log('🔧 smartJoinTextArray: Processing', textArray.length, 'tokens for', baseLang + ':', textArray);
    }

    // Debug: Test language-specific join rules (only once per language)
    if (!_langTested[baseLang]) {
      _langTested[baseLang] = true;
      await testLanguageJoins(baseLang);
    }

    let output = '';
    let prev = textArray[0] || '';

    for (let i = 1; i < textArray.length; i++) {
      const next = textArray[i] || '';
      console.log('🔧 Calling morph.join (async) with:', prev, next, baseLang);

      try {
        // Try both original case and lowercase for better rule matching
        let decision = await morph.join(prev, next, baseLang);
        console.log('🔧 Async join decision (original case):', decision);

        // If no rule found, try lowercase
        if (decision && decision.reason && decision.reason.includes('No join rule found')) {
          console.log('🔧 No rule found for original case, trying lowercase...');
          const lowerDecision = await morph.join(prev.toLowerCase(), next.toLowerCase(), baseLang);
          console.log('🔧 Async join decision (lowercase):', lowerDecision);

          // If lowercase worked, adapt the surfaces to preserve original case
          if (lowerDecision && !lowerDecision.reason?.includes('No join rule found')) {
            decision = {
              ...lowerDecision,
              surfacePrev: lowerDecision.surfacePrev ? preserveCase(prev, lowerDecision.surfacePrev) : prev,
              surfaceNext: lowerDecision.surfaceNext ? preserveCase(next, lowerDecision.surfaceNext) : next
            };
            console.log('🔧 Using lowercase rule with case preservation:', decision);
          }
        }

        // Handle contractions where surfaceNext might be empty
        if (decision && decision.reason && decision.reason.includes('contraction')) {
          // For contractions like "do not" → "don't", the result is in surfacePrev
          const contractionResult = decision.surfacePrev;
          console.log('🔧 Contraction detected:', prev, '+', next, '→', contractionResult);

          // Remove the previous word from output and replace with contraction
          if (i === 1) {
            // First pair - replace the output entirely
            output = contractionResult;
          } else {
            // Remove the last word (prev) from output and add contraction
            const outputParts = output.trim().split(' ');
            outputParts.pop(); // Remove the last word (which is prev)
            output = outputParts.join(' ') + (outputParts.length > 0 ? ' ' : '') + contractionResult;
          }

          // Skip the next word since it was consumed in the contraction
          i++;
          if (i < textArray.length) {
            prev = textArray[i] || '';
          } else {
            // No more words to process
            break;
          }
        } else {
          // Normal join logic
          if (i === 1) {
            output = decision && decision.surfacePrev !== undefined ? decision.surfacePrev : prev;
          }
          const noSpace = decision && decision.noSpace;
          const joiner = (decision && decision.joiner) || '';
          const surfaceNext = decision && decision.surfaceNext !== undefined ? decision.surfaceNext : next;
          console.log('🔧 Join components - noSpace:', noSpace, 'joiner:', joiner, 'surfaceNext:', surfaceNext);

          output += (noSpace ? '' : ' ') + joiner + surfaceNext;
          prev = surfaceNext || next; // Fallback to original if surfaceNext is empty
        }
      } catch (joinError) {
        console.log('🔧 Join error for', prev, '+', next, ':', joinError);
        // Fallback to space join for this pair
        if (i === 1) {
          output = prev;
        }
        output += ' ' + next;
        prev = next;
      }
    }

    if (textArray.length === 1) {
      output = prev;
    }
    console.log('🔧 Final async smartJoin result:', output);
    return output;
  } catch (e) {
    console.log('🔧 smartJoinTextArray error:', e);
    return (textArray || []).join(' ');
  }
}

function smartJoinTextArraySync(textArray, lang) {
  try {
    console.log('🔧 smartJoinTextArraySync called with:', textArray, lang);
    if (!Array.isArray(textArray) || textArray.length === 0) return '';

    const baseLang = i18nService.getBaseLang ? i18nService.getBaseLang(lang) : lang;
    console.log('🔧 Using base language:', baseLang);

    // Since morph.join is async, we need to fall back to simple space joining
    // The async version (smartJoinTextArray) should be used for proper joins
    console.log('🔧 Sync join not available, falling back to space join');
    console.log('🔧 Use smartJoinTextArray (async) for proper morphological joins');
    return (textArray || []).join(' ');
  } catch (e) {
    console.log('🔧 smartJoinTextArraySync error:', e);
    return (textArray || []).join(' ');
  }
}

// Test function to check which languages have working join rules
async function testLanguageJoins(lang) {
  const testCases = {
    'fr': [
      ['le', 'ami'], // should be l'ami
      ['de', 'eau'], // should be d'eau
      ['que', 'il'], // should be qu'il
      ['je', 'ai'],  // should be j'ai
    ],
    'es': [
      ['de', 'el'], // should be del
      ['a', 'el'],  // should be al
      ['con', 'migo'], // should be conmigo
    ],
    'it': [
      ['di', 'il'], // should be del
      ['a', 'il'],  // should be al
      ['con', 'il'], // should be col
      ['su', 'il'],  // should be sul
    ],
    'de': [
      ['zu', 'dem'], // should be zum
      ['zu', 'der'], // should be zur
      ['an', 'dem'], // should be am
      ['in', 'dem'], // should be im
    ],
    'en': [
      ['do', 'not'], // should be don't
      ['can', 'not'], // should be can't
      ['will', 'not'], // should be won't
      ['I', 'am'], // should be I'm
      ['it', 'is'], // should be it's
      ['we', 'are'], // should be we're
      ['they', 'are'], // should be they're
      ['I', 'will'], // should be I'll
    ]
  };

  const pairs = testCases[lang];
  if (!pairs) {
    console.log(`🔧 No test cases defined for language: ${lang}`);
    return;
  }

  console.log(`🔧 Testing ${lang} join rules...`);
  let workingCount = 0;

  try {
    for (const [left, right] of pairs) {
      const result = await morph.join(left, right, lang);
      const isWorking = result && !result.reason?.includes('No join rule found');
      if (isWorking) workingCount++;

      console.log(`🔧 ${lang}: ${left} + ${right} →`,
        isWorking ? `✅ ${result.surfacePrev}${result.joiner}${result.surfaceNext}` : '❌ No rule');
    }

    console.log(`🔧 ${lang} summary: ${workingCount}/${pairs.length} join rules working`);
  } catch (e) {
    console.log(`🔧 Error testing ${lang} joins:`, e);
  }
}

export const morphologyService = { isEnabled, ensureLanguage, maybeUpdateElementText, mapTagsToMorph, smartJoinTextArray, smartJoinTextArraySync };


