import { describe, expect, it } from 'vitest'
import { PREFECTURES, type Position } from './prefectures'

function inside(point: Position, ring: Position[]) {
  let result = false
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [x, y] = point
    const [currentX, currentY] = ring[current]
    const [previousX, previousY] = ring[previous]
    if ((currentY > y) !== (previousY > y) && x < (previousX - currentX) * (y - currentY) / (previousY - currentY) + currentX) result = !result
  }
  return result
}

describe('prefecture map metadata', () => {
  it('places every representative point inside one of its land polygons', () => {
    for (const prefecture of PREFECTURES) {
      expect(prefecture.polygons.some((polygon) => polygon[0] && inside(prefecture.center, polygon[0]))).toBe(true)
    }
  })

  it('maps stable codes to names independently of GeoJSON order', () => {
    expect(PREFECTURES[0]).toMatchObject({ code: 1, name: '北海道' })
    expect(PREFECTURES[12]).toMatchObject({ code: 13, name: '東京都' })
    expect(PREFECTURES[46]).toMatchObject({ code: 47, name: '沖縄県' })
  })
})
