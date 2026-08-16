import { describe, expect, it } from 'vitest'
import { createCapitalChoices, createChoices, nextUnusedPrefecture, resolveKind } from './quizEngine'
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

  it('creates capital questions with one answer and at least one clearly fictional distractor', () => {
    for (const target of PREFECTURES) {
      const choices = createCapitalChoices(target, fixedRandom)
      expect(choices).toHaveLength(4)
      expect(new Set(choices.map(({ name }) => name)).size).toBe(4)
      expect(choices.filter(({ name }) => name === target.capital)).toHaveLength(1)
      expect(choices.some(({ isFictional }) => isFictional)).toBe(true)
    }
  })

  it('keeps elementary distractors outside the answer region', () => {
    for (const target of PREFECTURES) {
      const distractors = createChoices(target, 'elementary', fixedRandom).filter(({ code }) => code !== target.code)
      expect(distractors.every(({ region }) => region !== target.region)).toBe(true)
    }
  })

  it('uses nearby map choices without always putting the answer in the same relative position', () => {
    const centerRanks = new Set<number>()
    for (const desiredRank of [0, 1, 2, 3]) {
      const target = PREFECTURES.find(({ name }) => name === '埼玉県')!
      const choices = createChoices(target, 'elementary', () => (desiredRank + 0.1) / 4, 'name-to-map')
      const center = choices.reduce(
        ([x, y], prefecture) => [x + prefecture.center[0] / choices.length, y + prefecture.center[1] / choices.length],
        [0, 0],
      )
      const fromCenter = choices
        .map((prefecture) => ({ code: prefecture.code, distance: Math.hypot(prefecture.center[0] - center[0], prefecture.center[1] - center[1]) }))
        .sort((a, b) => b.distance - a.distance)

      centerRanks.add(fromCenter.findIndex(({ code }) => code === target.code))
    }
    expect(centerRanks).toEqual(new Set([0, 1, 2, 3]))
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
