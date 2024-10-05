import { getCacheKey } from '../src/utils/cache'; // Adjust the import path as necessary

describe('getCacheKey', () => {
  it('should return a stringified JSON object with page, filters, and query', () => {
    const page = 1;
    const filters = { genre: 'action', rating: 'PG-13' };
    const query = 'Avengers';

    const expectedKey = JSON.stringify({ page, filters, query });
    const actualKey = getCacheKey(page, filters, query);

    expect(actualKey).toBe(expectedKey);
  });

  it('should return different keys for different inputs', () => {
    const page1 = 1;
    const filters1 = { genre: 'action', rating: 'PG-13' };
    const query1 = 'Avengers';

    const page2 = 2;
    const filters2 = { genre: 'comedy', rating: 'R' };
    const query2 = 'Jumanji';

    const key1 = getCacheKey(page1, filters1, query1);
    const key2 = getCacheKey(page2, filters2, query2);

    expect(key1).not.toBe(key2);
  });

  it('should return the same key for the same inputs', () => {
    const page = 1;
    const filters = { genre: 'action', rating: 'PG-13' };
    const query = 'Avengers';

    const key1 = getCacheKey(page, filters, query);
    const key2 = getCacheKey(page, filters, query);

    expect(key1).toBe(key2);
  });
});