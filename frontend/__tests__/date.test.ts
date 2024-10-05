import timeAgo from "../src/utils/date";

describe('timeAgo function', () => {
  test('should return "Just now" for current time', () => {
    const currentTime = new Date().toISOString();
    expect(timeAgo(currentTime)).toBe('Just now');
  });

  test('should return "1 minute ago" for 1 minute ago', () => {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(timeAgo(oneMinuteAgo)).toBe('1 minute ago');
  });

  test('should return "2 minutes ago" for 2 minutes ago', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(timeAgo(twoMinutesAgo)).toBe('2 minutes ago');
  });

  test('should return "1 hour ago" for 1 hour ago', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneHourAgo)).toBe('1 hour ago');
  });

  test('should return "1 day ago" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneDayAgo)).toBe('1 day ago');
  });

  test('should return "1 week ago" for 1 week ago', () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneWeekAgo)).toBe('1 week ago');
  });

  test('should return "1 month ago" for 1 month ago', () => {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneMonthAgo)).toBe('1 month ago');
  });

  test('should return "1 year ago" for 1 year ago', () => {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneYearAgo)).toBe('1 year ago');
  });
});

