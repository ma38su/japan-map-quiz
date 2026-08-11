import type { Level } from './prefectures'

export type Score = { correct: number; total: number }
export type Progress = { scores: Record<Level, Score>; mistakes: Record<number, number> }

export const STORAGE_KEY = 'japan-map-quiz-progress-v1'
export const EMPTY_PROGRESS: Progress = {
  scores: { elementary: { correct: 0, total: 0 }, junior: { correct: 0, total: 0 } },
  mistakes: {},
}

function isScore(value: unknown): value is Score {
  if (!value || typeof value !== 'object') return false
  const score = value as Record<string, unknown>
  return Number.isInteger(score.correct) && Number.isInteger(score.total) && Number(score.correct) >= 0 && Number(score.total) >= Number(score.correct)
}

export function parseProgress(value: string | null): Progress {
  try {
    const parsed = JSON.parse(value ?? 'null') as Record<string, unknown> | null
    if (!parsed || typeof parsed !== 'object' || !parsed.scores || typeof parsed.scores !== 'object') return structuredClone(EMPTY_PROGRESS)
    const scores = parsed.scores as Record<string, unknown>
    if (!isScore(scores.elementary) || !isScore(scores.junior)) return structuredClone(EMPTY_PROGRESS)
    const rawMistakes = parsed.mistakes && typeof parsed.mistakes === 'object' ? parsed.mistakes as Record<string, unknown> : {}
    const mistakes = Object.fromEntries(Object.entries(rawMistakes).filter(([code, count]) => Number(code) >= 1 && Number(code) <= 47 && Number.isInteger(count) && Number(count) >= 0).map(([code, count]) => [Number(code), Number(count)]))
    return { scores: { elementary: scores.elementary, junior: scores.junior }, mistakes }
  } catch {
    return structuredClone(EMPTY_PROGRESS)
  }
}

export function loadProgress() {
  return parseProgress(localStorage.getItem(STORAGE_KEY))
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}
