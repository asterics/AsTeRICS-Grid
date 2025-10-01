import { mapTagsToMorph } from './morphologyTagMap.js';

describe('mapTagsToMorph', () => {
  test('maps person and number', () => {
    const tags = ['1.PERS', 'SINGULAR', 'PRESENT'];
    const out = mapTagsToMorph(tags, 'en-US');
    expect(out).toEqual(expect.arrayContaining(['p1', 'sg', 'pres']));
  });

  test('maps plural and past', () => {
    const tags = ['3.PERS', 'PLURAL', 'PAST'];
    const out = mapTagsToMorph(tags, 'de-DE');
    expect(out).toEqual(expect.arrayContaining(['p3', 'pl', 'past']));
  });

  test('ignores negation in phase 1', () => {
    const tags = ['NEGATION', '2.PERS', 'SINGULAR'];
    const out = mapTagsToMorph(tags, 'en-US');
    expect(out).toEqual(expect.arrayContaining(['p2', 'sg']));
    expect(out).not.toEqual(expect.arrayContaining(['neg']));
  });
});

