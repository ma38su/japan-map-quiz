import geoJson from './data/prefectures.json'

export type Region = '北海道' | '東北' | '関東' | '中部' | '近畿' | '中国' | '四国' | '九州・沖縄'
export type Level = 'elementary' | 'junior'
export type QuestionKind = 'mix' | 'map-to-name' | 'name-to-map'
export type Position = [number, number]
export type Polygon = Position[][]

export type Prefecture = {
  code: number
  name: string
  reading: string
  region: Region
  polygons: Polygon[]
  center: Position
}

type GeoFeature = {
  properties: { P: string }
  geometry: { type: 'MultiPolygon'; coordinates: Polygon[] }
}

const REGION_CODES: Record<Region, number[]> = {
  北海道: [1],
  東北: [2, 3, 4, 5, 6, 7],
  関東: [8, 9, 10, 11, 12, 13, 14],
  中部: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  近畿: [24, 25, 26, 27, 28, 29, 30],
  中国: [31, 32, 33, 34, 35],
  四国: [36, 37, 38, 39],
  '九州・沖縄': [40, 41, 42, 43, 44, 45, 46, 47],
}

function area(ring: Position[]) {
  return Math.abs(ring.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length]
    return sum + x * nextY - nextX * y
  }, 0)) / 2
}

function centerOf(ring: Position[]): Position {
  const usable = ring.slice(0, -1)
  return [
    usable.reduce((sum, point) => sum + point[0], 0) / usable.length,
    usable.reduce((sum, point) => sum + point[1], 0) / usable.length,
  ]
}

const features = (geoJson as unknown as { features: GeoFeature[] }).features
const READINGS = 'ほっかいどう あおもりけん いわてけん みやぎけん あきたけん やまがたけん ふくしまけん いばらきけん とちぎけん ぐんまけん さいたまけん ちばけん とうきょうと かながわけん にいがたけん とやまけん いしかわけん ふくいけん やまなしけん ながのけん ぎふけん しずおかけん あいちけん みえけん しがけん きょうとふ おおさかふ ひょうごけん ならけん わかやまけん とっとりけん しまねけん おかやまけん ひろしまけん やまぐちけん とくしまけん かがわけん えひめけん こうちけん ふくおかけん さがけん ながさきけん くまもとけん おおいたけん みやざきけん かごしまけん おきなわけん'.split(' ')

export const PREFECTURES: Prefecture[] = features.map((feature, index) => {
  const code = index + 1
  const region = (Object.entries(REGION_CODES) as [Region, number[]][]).find(([, codes]) => codes.includes(code))?.[0] ?? '関東'
  const primary = [...feature.geometry.coordinates].sort((a, b) => area(b[0]) - area(a[0]))[0]?.[0] ?? []
  return { code, name: feature.properties.P, reading: READINGS[index], region, polygons: feature.geometry.coordinates, center: centerOf(primary) }
})

export function shuffle<T>(items: readonly T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

function distance(a: Prefecture, b: Prefecture) {
  return Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1])
}

export function createChoices(target: Prefecture, level: Level) {
  const others = PREFECTURES.filter((prefecture) => prefecture.code !== target.code)
  const ranked = level === 'junior'
    ? [...others].sort((a, b) => Number(b.region === target.region) - Number(a.region === target.region) || distance(target, a) - distance(target, b))
    : shuffle(others.filter((prefecture) => prefecture.region !== target.region))
  return shuffle([target, ...ranked.slice(0, 3)])
}

export const LEVELS: Record<Level, { label: string; description: string }> = {
  elementary: { label: '小学生向け', description: '小学校の社会で学ぶ、47都道府県の名前と場所を覚えます。' },
  junior: { label: '中学生向け', description: '同じ地方や近くの県を見分けて、47都道府県の位置を確実にします。' },
}

export const QUESTION_KINDS: Record<QuestionKind, { label: string }> = {
  mix: { label: 'おまかせミックス' },
  'map-to-name': { label: '地図 → 都道府県名' },
  'name-to-map': { label: '都道府県名 → 地図' },
}
