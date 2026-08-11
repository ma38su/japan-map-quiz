import { describe, expect, it } from 'vitest'
import { createChoices, nextUnusedPrefecture, resolveKind } from './quizEngine'
import { PREFECTURES } from './prefectures'

const fixedRandom = () => 0.42

describe('quiz engine', () => {
  it('uses all 47 prefectures as the question pool', () => {
    expect(PREFECTURES).toHaveLength(47)
    expect(new Set(PREFECTURES.map(({ code }) => code)).size).toBe(47)
  })

  it('creates four unique choices including the answer', () => {
    for (const level of ['elementary', 'junior'] as const) {
      for (const target of PREFECTURES) {
        const choices = createChoices(target, level, fixedRandom)
        expect(choices).toHaveLength(4)
        expect(new Set(choices.map(({ code }) => code)).size).toBe(4)
        expect(choices.some(({ code }) => code === target.code)).toBe(true)
      }
    }
  })

  it('keeps elementary distractors outside the answer region', () => {
    for (const target of PREFECTURES) {
      const distractors = createChoices(target, 'elementary', fixedRandom).filter(({ code }) => code !== target.code)
      expect(distractors.every(({ region }) => region !== target.region)).toBe(true)
    }
  })

  it('alternates mixed question types', () => {
    expect(resolveKind('mix')).toBe('map-to-name')
    expect(resolveKind('mix', 'map-to-name')).toBe('name-to-map')
    expect(resolveKind('mix', 'name-to-map')).toBe('map-to-name')
  })

  it('never returns a used prefecture', () => {
    const used = PREFECTURES.slice(0, 46).map(({ code }) => code)
    expect(nextUnusedPrefecture(used, fixedRandom)?.code).toBe(47)
  })
})
