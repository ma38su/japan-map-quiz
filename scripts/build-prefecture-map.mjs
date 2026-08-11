import { readFile, writeFile } from 'node:fs/promises'

const source = new URL('../node_modules/open-data-jp-prefectures-geojson/output/prefectures.geojson', import.meta.url)
const destination = new URL('../src/data/prefectures.json', import.meta.url)
const data = JSON.parse(await readFile(source, 'utf8'))
const tolerance = 0.008

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1])
  const position = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(point[0] - (start[0] + position * dx), point[1] - (start[1] + position * dy))
}

function simplifyLine(points) {
  if (points.length <= 4) return points
  const open = points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1] ? points.slice(0, -1) : points
  const keep = new Set([0, open.length - 1])
  const stack = [[0, open.length - 1]]
  while (stack.length) {
    const [startIndex, endIndex] = stack.pop()
    let maximum = 0
    let selected = -1
    for (let index = startIndex + 1; index < endIndex; index++) {
      const distance = perpendicularDistance(open[index], open[startIndex], open[endIndex])
      if (distance > maximum) { maximum = distance; selected = index }
    }
    if (maximum > tolerance && selected > 0) {
      keep.add(selected)
      stack.push([startIndex, selected], [selected, endIndex])
    }
  }
  const result = [...keep].sort((a, b) => a - b).map((index) => open[index].map((value) => Math.round(value * 100000) / 100000))
  if (result.length < 3) return points.slice(0, 4)
  return [...result, result[0]]
}

function ringArea(ring) {
  return Math.abs(ring.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length]
    return sum + x * nextY - nextX * y
  }, 0)) / 2
}

for (const feature of data.features) {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const simplified = polygons
    .map((polygon) => polygon.map(simplifyLine))
    .filter((polygon) => ringArea(polygon[0]) > 0.000015)
  feature.geometry = { type: 'MultiPolygon', coordinates: simplified }
}

await writeFile(destination, JSON.stringify(data))
