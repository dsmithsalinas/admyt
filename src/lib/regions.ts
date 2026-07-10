export const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
}

export const VALID_STATE_ABBREVS = new Set(Object.values(STATE_NAME_TO_ABBR))

export const REGION_TO_STATES: Record<string, string[]> = {
  'pacific northwest': ['WA', 'OR', 'ID'],
  pnw: ['WA', 'OR', 'ID'],
  'west coast': ['CA', 'OR', 'WA'],
  'new england': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT'],
  'mid-atlantic': ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA'],
  midwest: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  northeast: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
  south: ['VA', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'TN', 'KY', 'AR', 'LA'],
  southeast: ['VA', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'TN', 'KY', 'AR', 'LA'],
  southwest: ['AZ', 'NM', 'TX', 'OK', 'NV'],
  'mountain west': ['CO', 'UT', 'WY', 'MT', 'ID', 'NV'],
  rockies: ['CO', 'UT', 'WY', 'MT', 'ID', 'NV'],
  'great lakes': ['MI', 'WI', 'IL', 'IN', 'OH', 'MN'],
  'deep south': ['AL', 'GA', 'LA', 'MS', 'SC'],
}

export function expandLocationTerms(terms: string[]): { states: Set<string>; freeText: string[] } {
  const states = new Set<string>()
  const freeText: string[] = []

  for (const term of terms) {
    const normalizedTerm = term.trim().toLowerCase()
    if (!normalizedTerm) continue

    const regionStates = REGION_TO_STATES[normalizedTerm]
    if (regionStates) {
      regionStates.forEach(state => states.add(state))
      continue
    }

    const stateAbbr = STATE_NAME_TO_ABBR[normalizedTerm]
    if (stateAbbr) {
      states.add(stateAbbr)
      continue
    }

    const maybeAbbr = normalizedTerm.toUpperCase()
    if (VALID_STATE_ABBREVS.has(maybeAbbr)) {
      states.add(maybeAbbr)
      continue
    }

    freeText.push(normalizedTerm)
  }

  return { states, freeText }
}
