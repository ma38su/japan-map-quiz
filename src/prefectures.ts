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

function pointInRing([x, y]: Position, ring: Position[]) {
  let inside = false
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current]
    const [previousX, previousY] = ring[previous]
    if ((currentY > y) !== (previousY > y) && x < (previousX - currentX) * (y - currentY) / (previousY - currentY) + currentX) inside = !inside
  }
  return inside
}

function polygonCentroid(ring: Position[]): Position {
  let twiceArea = 0
  let x = 0
  let y = 0
  for (let index = 0; index < ring.length - 1; index++) {
    const [currentX, currentY] = ring[index]
    const [nextX, nextY] = ring[index + 1]
    const cross = currentX * nextY - nextX * currentY
    twiceArea += cross
    x += (currentX + nextX) * cross
    y += (currentY + nextY) * cross
  }
  if (Math.abs(twiceArea) < Number.EPSILON) return ring[0] ?? [0, 0]
  return [x / (3 * twiceArea), y / (3 * twiceArea)]
}

function distanceToSegment(point: Position, start: Position, end: Position) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const lengthSquared = dx * dx + dy * dy
  const ratio = lengthSquared ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared)) : 0
  return Math.hypot(point[0] - (start[0] + ratio * dx), point[1] - (start[1] + ratio * dy))
}

export function representativePoint(ring: Position[]): Position {
  const centroid = polygonCentroid(ring)
  if (pointInRing(centroid, ring)) return centroid

  const xs = ring.map(([x]) => x)
  const ys = ring.map(([, y]) => y)
  const minX = Math.min(...xs); const maxX = Math.max(...xs)
  const minY = Math.min(...ys); const maxY = Math.max(...ys)
  let best = ring[0] ?? [0, 0]
  let bestDistance = -1
  for (let row = 0; row <= 24; row++) for (let column = 0; column <= 24; column++) {
    const candidate: Position = [minX + (maxX - minX) * column / 24, minY + (maxY - minY) * row / 24]
    if (!pointInRing(candidate, ring)) continue
    const edgeDistance = Math.min(...ring.slice(0, -1).map((point, index) => distanceToSegment(candidate, point, ring[index + 1])))
    if (edgeDistance > bestDistance) { best = candidate; bestDistance = edgeDistance }
  }
  return best
}

const features = (geoJson as unknown as { features: GeoFeature[] }).features
const NAMES = '北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県'.split(' ')
const READINGS = 'ほっかいどう あおもりけん いわてけん みやぎけん あきたけん やまがたけん ふくしまけん いばらきけん とちぎけん ぐんまけん さいたまけん ちばけん とうきょうと かながわけん にいがたけん とやまけん いしかわけん ふくいけん やまなしけん ながのけん ぎふけん しずおかけん あいちけん みえけん しがけん きょうとふ おおさかふ ひょうごけん ならけん わかやまけん とっとりけん しまねけん おかやまけん ひろしまけん やまぐちけん とくしまけん かがわけん えひめけん こうちけん ふくおかけん さがけん ながさきけん くまもとけん おおいたけん みやざきけん かごしまけん おきなわけん'.split(' ')

export const PREFECTURES: Prefecture[] = NAMES.map((name, index) => {
  const code = index + 1
  const feature = features.find((candidate) => candidate.properties.P === name)
  if (!feature) throw new Error(`都道府県データが見つかりません: ${name}`)
  const region = (Object.entries(REGION_CODES) as [Region, number[]][]).find(([, codes]) => codes.includes(code))?.[0] ?? '関東'
  const primary = [...feature.geometry.coordinates].sort((a, b) => area(b[0]) - area(a[0]))[0]?.[0] ?? []
  return { code, name, reading: READINGS[index], region, polygons: feature.geometry.coordinates, center: representativePoint(primary) }
})

export const LEVELS: Record<Level, { label: string; labelRuby: string; descriptionRuby: string }> = {
  elementary: {
    label: '小学生向け',
    labelRuby: '｜小学生向《しょうがくせいむ》け',
    descriptionRuby: '｜小学校《しょうがっこう》の｜社会《しゃかい》で｜学《まな》ぶ、47｜都道府県《とどうふけん》の｜名前《なまえ》と｜場所《ばしょ》を｜覚《おぼ》えます。',
  },
  junior: {
    label: '中学生向け',
    labelRuby: '｜中学生向《ちゅうがくせいむ》け',
    descriptionRuby: '｜同《おな》じ｜地方《ちほう》や｜近《ちか》くの｜県《けん》を｜見分《みわ》けて、47｜都道府県《とどうふけん》の｜位置《いち》を｜確実《かくじつ》にします。',
  },
}

export const QUESTION_KINDS: Record<QuestionKind, { label: string; labelRuby: string }> = {
  mix: { label: 'おまかせミックス', labelRuby: 'おまかせミックス' },
  'map-to-name': { label: '地図 → 都道府県名', labelRuby: '｜地図《ちず》 → ｜都道府県名《とどうふけんめい》' },
  'name-to-map': { label: '都道府県名 → 地図', labelRuby: '｜都道府県名《とどうふけんめい》 → ｜地図《ちず》' },
}
