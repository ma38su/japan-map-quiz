import { describe, expect, it } from 'vitest'
import { EMPTY_PROGRESS, parseProgress } from './progress'

describe('stored progress', () => {
  it('accepts valid score and mistake data', () => {
    const value = parseProgress(JSON.stringify({
      scores: { elementary: { correct: 3, total: 5 }, junior: { correct: 1, total: 2 } },
      mistakes: { 13: 2 },
    }))
    expect(value.scores.elementary).toEqual({ correct: 3, total: 5 })
    expect(value.mistakes[13]).toBe(2)
  })

  it('falls back safely for malformed data', () => {
    expect(parseProgress('{broken')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress(JSON.stringify({ scores: { elementary: { correct: 9, total: 2 } } }))).toEqual(EMPTY_PROGRESS)
  })

  it('discards invalid prefecture mistake keys', () => {
    const value = parseProgress(JSON.stringify({
      scores: { elementary: { correct: 0, total: 0 }, junior: { correct: 0, total: 0 } },
      mistakes: { 0: 4, 1: 2, 48: 3 },
    }))
    expect(value.mistakes).toEqual({ 1: 2 })
  })
})
