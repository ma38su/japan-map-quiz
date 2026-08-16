import { PREFECTURES, type Level, type Prefecture, type QuestionKind } from './prefectures'

export type ActiveKind = Exclude<QuestionKind, 'mix'>
export type RandomSource = () => number
export type CapitalChoice = { id: string; name: string; reading: string; isFictional: boolean }

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

const TRICK_CHOICES: Partial<Record<number, string[]>> = {
  8: ['つくば市'], 9: ['日光市'], 10: ['高崎市'], 13: ['東京市'], 19: ['山梨市'],
  23: ['愛知市'], 24: ['四日市市'], 25: ['近江市'], 31: ['取鳥市'], 32: ['出雲市'],
  35: ['下関市'], 37: ['松山市'], 38: ['高松市'], 40: ['北九州市'], 47: ['沖縄市'],
}

function fictionalCapital(target: Prefecture) {
  const base = target.name.replace(/[都道府県]$/, '')
  const name = `${base}中央市`
  return { id: `fictional-${target.code}`, name, reading: '', isFictional: true }
}

export function createCapitalChoices(target: Prefecture, random: RandomSource = Math.random): CapitalChoice[] {
  const correct: CapitalChoice = { id: `capital-${target.code}`, name: target.capital, reading: target.capitalReading, isFictional: false }
  const trickNames = TRICK_CHOICES[target.code] ?? []
  const realDistractors = PREFECTURES
    .filter((prefecture) => prefecture.code !== target.code && prefecture.capital !== target.capital)
    .sort((a, b) => {
      const aTrick = trickNames.includes(a.capital) ? -100 : 0
      const bTrick = trickNames.includes(b.capital) ? -100 : 0
      return aTrick - bTrick || distance(target, a) - distance(target, b)
    })
    .slice(0, 8)
    .map((prefecture) => ({ id: `capital-${prefecture.code}`, name: prefecture.capital, reading: prefecture.capitalReading, isFictional: false }))
  const namedTricks = trickNames
    .filter((name) => !PREFECTURES.some((prefecture) => prefecture.capital === name))
    .map((name, index) => ({ id: `trick-${target.code}-${index}`, name, reading: '', isFictional: true }))
  const distractors = [...namedTricks, fictionalCapital(target), ...shuffle(realDistractors, random)]
  return shuffle([correct, ...distractors.slice(0, 3)], random)
}

function distance(a: Prefecture, b: Prefecture) {
  return Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1])
}

function clusterSize(prefectures: readonly Prefecture[]) {
  let total = 0
  for (let first = 0; first < prefectures.length; first++) {
    for (let second = first + 1; second < prefectures.length; second++) {
      total += distance(prefectures[first], prefectures[second])
    }
  }
  return total
}

function targetCenterRank(target: Prefecture, prefectures: readonly Prefecture[]) {
  const center = prefectures.reduce(
    ([x, y], prefecture) => [x + prefecture.center[0] / prefectures.length, y + prefecture.center[1] / prefectures.length],
    [0, 0],
  )
  const distances = prefectures.map((prefecture) => ({ code: prefecture.code, distance: Math.hypot(prefecture.center[0] - center[0], prefecture.center[1] - center[1]) }))
  distances.sort((a, b) => b.distance - a.distance)
  return distances.findIndex(({ code }) => code === target.code)
}

function createNearbyChoices(target: Prefecture, random: RandomSource) {
  const nearest = PREFECTURES
    .filter((prefecture) => prefecture.code !== target.code)
    .sort((a, b) => distance(target, a) - distance(target, b))
    .slice(0, 12)
  const clustersByRank: Prefecture[][][] = Array.from({ length: 4 }, () => [])

  for (let first = 0; first < nearest.length - 2; first++) {
    for (let second = first + 1; second < nearest.length - 1; second++) {
      for (let third = second + 1; third < nearest.length; third++) {
        const cluster = [target, nearest[first], nearest[second], nearest[third]]
        clustersByRank[targetCenterRank(target, cluster)].push(cluster)
      }
    }
  }

  // Randomize whether the answer is central or peripheral. If geography makes
  // the requested rank impossible (notably for islands), use the nearest rank.
  const desiredRank = Math.floor(random() * 4)
  const availableRanks = clustersByRank
    .map((clusters, rank) => ({ clusters, rank }))
    .filter(({ clusters }) => clusters.length > 0)
    .sort((a, b) => Math.abs(a.rank - desiredRank) - Math.abs(b.rank - desiredRank))
  const clusters = availableRanks[0]?.clusters ?? []
  clusters.sort((a, b) => clusterSize(a) - clusterSize(b))
  const compactClusters = clusters.slice(0, Math.min(6, clusters.length))
  const selected = compactClusters[Math.floor(random() * compactClusters.length)] ?? [target, ...nearest.slice(0, 3)]
  return shuffle(selected, random)
}

export function createChoices(target: Prefecture, level: Level, random: RandomSource = Math.random, kind: ActiveKind = 'map-to-name') {
  if (kind === 'name-to-map') return createNearbyChoices(target, random)

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
