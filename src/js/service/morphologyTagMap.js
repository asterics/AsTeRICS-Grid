export function mapTagsToMorph(tags, lang) {
  const t = tags || [];
  const out = [];
  if (t.includes('1.PERS')) out.push('p1');
  if (t.includes('2.PERS')) out.push('p2');
  if (t.includes('3.PERS')) out.push('p3');
  if (t.includes('PLURAL')) out.push('pl');
  if (t.includes('SINGULAR')) out.push('sg');
  if (t.includes('PAST')) out.push('past');
  if (t.includes('PRESENT')) out.push('pres');
  if (t.includes('FUTURE')) out.push('fut');
  if (t.includes('GERUND')) out.push('ger');
  // NEGATION handled via join in Phase 2, not here
  return out;
}

