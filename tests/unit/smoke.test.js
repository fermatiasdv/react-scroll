import { describe, expect, it } from 'vitest'
import { layoutFor } from '@scroll/layout'

describe('alias al legacy', () => {
  it('@scroll/layout exporta layoutFor como función', () => {
    expect(typeof layoutFor).toBe('function')
  })
})
