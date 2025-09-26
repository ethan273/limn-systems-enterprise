import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className merge)', () => {
    it('should merge classes correctly', () => {
      const result = cn('text-base', 'text-lg', 'font-bold')
      expect(result).toBe('text-lg font-bold')
    })

    it('should handle conditional classes', () => {
      const result = cn('text-base', false && 'hidden', 'font-bold')
      expect(result).toBe('text-base font-bold')
    })

    it('should handle undefined and null values', () => {
      const result = cn('text-base', undefined, null, 'font-bold')
      expect(result).toBe('text-base font-bold')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})