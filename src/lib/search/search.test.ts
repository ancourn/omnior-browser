import { searchService } from './search-service'

// Simple test to verify search functionality
describe('SearchService', () => {
  test('should return empty results for empty query', async () => {
    const results = await searchService.search('')
    expect(results).toEqual([])
  })

  test('should return results for valid query', async () => {
    const results = await searchService.search('github')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBeDefined()
    expect(results[0].title).toBeDefined()
  })

  test('should filter by sources', async () => {
    const results = await searchService.search('github', {
      sources: ['tabs']
    })
    expect(results.every(r => r.type === 'tab')).toBe(true)
  })

  test('should exclude private results when requested', async () => {
    const results = await searchService.search('private', {
      excludePrivate: true
    })
    expect(results.every(r => !r.isPrivate)).toBe(true)
  })

  test('should respect max results limit', async () => {
    const results = await searchService.search('test', {
      maxResults: 5
    })
    expect(results.length).toBeLessThanOrEqual(5)
  })

  test('should get available sources', () => {
    const sources = searchService.getAvailableSources()
    expect(sources.length).toBeGreaterThan(0)
    expect(sources[0].name).toBeDefined()
    expect(sources[0].icon).toBeDefined()
  })
})