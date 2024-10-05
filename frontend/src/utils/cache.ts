export const getCacheKey = (page: number, filters: any, query: string) => {
  return JSON.stringify({ page, filters, query });
};