import { useEffect, useMemo, useState } from 'react'
import { createCapitalChoices, createChoices, nextUnusedPrefecture, resolveKind, type ActiveKind, type CapitalChoice } from './quizEngine'
import { loadProgress, saveProgress } from './progress'
import { type Level, type Prefecture, type QuestionKind } from './prefectures'

export type View = 'home' | 'quiz' | 'score'
export type Result = 'idle' | 'correct' | 'wrong'

const EMPTY_ROUND = { answered: 0, correct: 0, used: [] as number[] }

export function useQuiz() {
  const [view, setView] = useState<View>('home')
  const [level, setLevel] = useState<Level>('elementary')
  const [kind, setKind] = useState<QuestionKind>('mix')
  const [activeKind, setActiveKind] = useState<ActiveKind>('map-to-name')
  const [target, setTarget] = useState<Prefecture | null>(null)
  const [choices, setChoices] = useState<Prefecture[]>([])
  const [capitalChoices, setCapitalChoices] = useState<CapitalChoice[]>([])
  const [selectedCapital, setSelectedCapital] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<Result>('idle')
  const [round, setRound] = useState(EMPTY_ROUND)
  const [complete, setComplete] = useState(false)
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => saveProgress(progress), [progress])

  const total = useMemo(() => Object.values(progress.scores).reduce(
    (sum, score) => ({ correct: sum.correct + score.correct, total: sum.total + score.total }),
    { correct: 0, total: 0 },
  ), [progress])

  function showQuestion(prefecture: Prefecture, nextKind: ActiveKind, used: number[], choiceLevel = level) {
    setTarget(prefecture)
    setActiveKind(nextKind)
    setChoices(nextKind === 'capital' ? [] : createChoices(prefecture, choiceLevel, Math.random, nextKind))
    setCapitalChoices(nextKind === 'capital' ? createCapitalChoices(prefecture) : [])
    setSelected(null)
    setSelectedCapital(null)
    setResult('idle')
    setComplete(false)
    setRound((current) => ({ ...current, used }))
  }

  function start(nextLevel = level, nextKind = kind) {
    const first = nextUnusedPrefecture([])
    if (!first) return
    const resolved = resolveKind(nextKind)
    setLevel(nextLevel)
    setKind(nextKind)
    setRound({ ...EMPTY_ROUND, used: [first.code] })
    setView('quiz')
    showQuestion(first, resolved, [first.code], nextLevel)
  }

  function nextQuestion() {
    if (round.answered >= 10) {
      setTarget(null)
      setChoices([])
      setCapitalChoices([])
      setComplete(true)
      return
    }
    const next = nextUnusedPrefecture(round.used)
    if (next) showQuestion(next, resolveKind(kind, activeKind), [...round.used, next.code])
  }

  function answer(prefecture: Prefecture) {
    if (!target || result !== 'idle') return
    const isCorrect = prefecture.code === target.code
    setSelected(prefecture.code)
    setResult(isCorrect ? 'correct' : 'wrong')
    setRound((current) => ({ ...current, answered: current.answered + 1, correct: current.correct + Number(isCorrect) }))
    setProgress((current) => ({
      scores: {
        ...current.scores,
        [level]: {
          correct: current.scores[level].correct + Number(isCorrect),
          total: current.scores[level].total + 1,
        },
      },
      mistakes: isCorrect ? current.mistakes : {
        ...current.mistakes,
        [target.code]: (current.mistakes[target.code] ?? 0) + 1,
      },
    }))
  }

  function answerCapital(choice: CapitalChoice) {
    if (!target || result !== 'idle') return
    const isCorrect = choice.name === target.capital
    setSelectedCapital(choice.id)
    setResult(isCorrect ? 'correct' : 'wrong')
    setRound((current) => ({ ...current, answered: current.answered + 1, correct: current.correct + Number(isCorrect) }))
    setProgress((current) => ({
      scores: { ...current.scores, [level]: { correct: current.scores[level].correct + Number(isCorrect), total: current.scores[level].total + 1 } },
      mistakes: isCorrect ? current.mistakes : { ...current.mistakes, [target.code]: (current.mistakes[target.code] ?? 0) + 1 },
    }))
  }

  function resetSettings() {
    setTarget(null)
    setChoices([])
    setCapitalChoices([])
    setComplete(false)
    setView('home')
  }

  return {
    view, setView, level, setLevel, kind, setKind, activeKind, target, choices, capitalChoices, selectedCapital,
    selected, result, round, complete, progress, total,
    start, nextQuestion, answer, answerCapital, resetSettings,
  }
}

export type QuizController = ReturnType<typeof useQuiz>
