export default function timeAgo(isoString: string): string {
  const now = new Date();
  const pastDate = new Date(isoString);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const amount = Math.floor(diffInSeconds / secondsInUnit);
    if (amount >= 1) {
      return `${amount} ${unit}${amount > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

const isoDateString = "2024-09-21T10:41:06.650Z";
