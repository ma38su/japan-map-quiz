import { PREFECTURES, type Level, type Prefecture, type QuestionKind } from './prefectures'

export type ActiveKind = Exclude<QuestionKind, 'mix'>
export type RandomSource = () => number

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function resolveKind(kind: QuestionKind, previous?: ActiveKind): ActiveKind {
  if (kind !== 'mix') return kind
  return previous === 'map-to-name' ? 'name-to-map' : 'map-to-name'
}

function distance(a: Prefecture, b: Prefecture) {
  return Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1])
}

export function createChoices(target: Prefecture, level: Level, random: RandomSource = Math.random) {
  const others = PREFECTURES.filter((prefecture) => prefecture.code !== target.code)
  if (level === 'elementary') {
    const candidates = others.filter((prefecture) => prefecture.region !== target.region)
    return shuffle([target, ...shuffle(candidates, random).slice(0, 3)], random)
  }

  const sameRegion = others.filter((prefecture) => prefecture.region === target.region).sort((a, b) => distance(target, a) - distance(target, b))
  const nearby = others.filter((prefecture) => prefecture.region !== target.region).sort((a, b) => distance(target, a) - distance(target, b))
  const candidatePool = [...sameRegion.slice(0, 7), ...nearby.slice(0, Math.max(0, 7 - sameRegion.length))]
  return shuffle([target, ...shuffle(candidatePool, random).slice(0, 3)], random)
}

export function nextUnusedPrefecture(used: readonly number[], random: RandomSource = Math.random) {
  return shuffle(PREFECTURES.filter((prefecture) => !used.includes(prefecture.code)), random)[0]
}
