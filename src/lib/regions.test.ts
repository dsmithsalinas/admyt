import { describe, expect, it } from 'vitest'
import { expandLocationTerms } from './regions'

describe('location expansion', () => {
  it('expands named regions into states', () => {
    const result = expandLocationTerms(['Pacific Northwest'])
    expect([...result.states].sort()).toEqual(['ID', 'OR', 'WA'])
    expect(result.freeText).toEqual([])
  })

  it('normalizes state names and abbreviations', () => {
    const result = expandLocationTerms(['California', 'ny'])
    expect(result.states).toEqual(new Set(['CA', 'NY']))
  })

  it('preserves city and natural-language location terms for text matching', () => {
    const result = expandLocationTerms(['Boston', 'near the ocean'])
    expect(result.freeText).toEqual(['boston', 'near the ocean'])
  })
})
