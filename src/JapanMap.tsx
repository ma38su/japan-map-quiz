import type { Prefecture, Position } from './prefectures'
import { PREFECTURES } from './prefectures'

const COLORS = [
  { fill: '#e96149', stroke: '#983c2e', text: '#fff' },
  { fill: '#e8b72d', stroke: '#816316', text: '#17333f' },
  { fill: '#239b80', stroke: '#116451', text: '#fff' },
  { fill: '#7068c9', stroke: '#413c89', text: '#fff' },
]

function project([longitude, latitude]: Position): Position {
  if (latitude < 30) return [38 + (longitude - 122.5) * 13.5, 500 - (latitude - 24) * 20]
  return [85 + (longitude - 128) * 26.5, 500 - (latitude - 30) * 28]
}

function pathFor(prefecture: Prefecture) {
  return prefecture.polygons.flatMap((polygon) => polygon.map((ring) => {
    const projected = ring.map(project)
    if (!projected.length || (prefecture.code !== 47 && ring.every(([, latitude]) => latitude < 30))) return ''
    return `M${projected.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`
  })).join('')
}

function ringArea(ring: Position[]) {
  return Math.abs(ring.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length]
    return sum + x * nextY - nextX * y
  }, 0))
}

function focusViewBox(prefecture: Prefecture) {
  const primaryRing = prefecture.polygons
    .map((polygon) => polygon[0] ?? [])
    .sort((a, b) => ringArea(b) - ringArea(a))[0]
  const points = primaryRing.filter(([, latitude]) => prefecture.code === 47 || latitude >= 30).map(project)
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const minX = Math.min(...xs); const maxX = Math.max(...xs)
  const minY = Math.min(...ys); const maxY = Math.max(...ys)
  const height = Math.max(90, maxX - minX, maxY - minY) * 1.35
  const width = height * 600 / 560
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const x = Math.max(0, Math.min(600 - width, centerX - width / 2))
  const y = Math.max(0, Math.min(560 - height, centerY - height / 2))
  return `${x} ${y} ${width} ${height}`
}

function bounds(prefecture: Prefecture) {
  const points = prefecture.polygons.flatMap((polygon) => polygon[0] ?? []).filter(([, latitude]) => prefecture.code === 47 || latitude >= 30).map(project)
  return {
    width: Math.max(...points.map(([x]) => x)) - Math.min(...points.map(([x]) => x)),
    height: Math.max(...points.map(([, y]) => y)) - Math.min(...points.map(([, y]) => y)),
  }
}

export default function JapanMap({ target, choices = [] }: { target?: Prefecture; choices?: Prefecture[] }) {
  const specs = choices.map((prefecture, index) => {
    const point = project(prefecture.center)
    const size = bounds(prefecture)
    const closeToAnother = choices.some((other) => other.code !== prefecture.code && Math.hypot(point[0] - project(other.center)[0], point[1] - project(other.center)[1]) < 38)
    return { prefecture, index, point, needsLeader: Math.max(size.width, size.height) < 35 || closeToAnother }
  })
  const occupied: Position[] = specs.filter((spec) => !spec.needsLeader).map((spec) => spec.point)
  const placements = new Map<number, Position>()
  for (const spec of specs) {
    if (!spec.needsLeader) { placements.set(spec.prefecture.code, spec.point); continue }
    const candidates = [38, 54].flatMap((distance) => [[0, -distance], [distance, 0], [0, distance], [-distance, 0], [distance * .72, -distance * .72], [distance * .72, distance * .72], [-distance * .72, distance * .72], [-distance * .72, -distance * .72]])
      .map(([x, y]) => [Math.max(17, Math.min(583, spec.point[0] + x)), Math.max(17, Math.min(543, spec.point[1] + y))] as Position)
      .sort((a, b) => {
        const score = (point: Position) => occupied.reduce((sum, other) => sum + (Math.hypot(point[0] - other[0], point[1] - other[1]) < 31 ? 1000 : 0), 0) + Math.hypot(point[0] - spec.point[0], point[1] - spec.point[1])
        return score(a) - score(b)
      })
    const label = candidates[0]
    placements.set(spec.prefecture.code, label)
    occupied.push(label)
  }
  return <svg className="japan-map" viewBox={target ? focusViewBox(target) : '0 0 600 560'} role="img" aria-label={target ? `色がついた${target.name}周辺の拡大地図` : '47都道府県の境界を表示した日本地図'}>
    <rect width="600" height="560" fill="#567c89" />
    <g className="map-grid">
      {[150, 300, 450].map((x) => <line key={`x${x}`} x1={x} y1="0" x2={x} y2="560" />)}
      {[140, 280, 420].map((y) => <line key={`y${y}`} x1="0" y1={y} x2="600" y2={y} />)}
    </g>
    <rect className="okinawa-inset" x="20" y="350" width="145" height="175" rx="5" />
    <text className="inset-label" x="32" y="372">沖縄</text>
    <g className="prefectures">
      {PREFECTURES.map((prefecture) => {
        const choiceIndex = choices.findIndex((choice) => choice.code === prefecture.code)
        const selected = choiceIndex >= 0 ? COLORS[choiceIndex] : target?.code === prefecture.code ? { fill: '#f4c331', stroke: '#8d6816', text: '#17333f' } : null
        return <path key={prefecture.code} d={pathFor(prefecture)} fill={selected?.fill ?? '#91a79d'} stroke={selected?.stroke ?? '#dbe8e2'} strokeWidth={selected ? 2.2 : .8} />
      })}
    </g>
    {specs.map(({ prefecture, index, point, needsLeader }) => {
      const label = placements.get(prefecture.code) ?? point
      return <g key={prefecture.code} className="map-marker">
        {needsLeader && <><line className="leader-halo" x1={point[0]} y1={point[1]} x2={label[0]} y2={label[1]} /><line className="leader" x1={point[0]} y1={point[1]} x2={label[0]} y2={label[1]} /><circle cx={point[0]} cy={point[1]} r="3" fill={COLORS[index].fill} stroke="#fff" /></>}
        <circle cx={label[0]} cy={label[1]} r="13" fill={COLORS[index].fill} stroke="#fff" strokeWidth="2" />
        <text x={label[0]} y={label[1] + .5} fill={COLORS[index].text} textAnchor="middle" dominantBaseline="middle">{String.fromCharCode(65 + index)}</text>
      </g>
    })}
  </svg>
}
