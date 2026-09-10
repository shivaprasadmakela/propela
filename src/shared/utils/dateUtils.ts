/**
 * Formats a timestamp that may arrive as epoch milliseconds, epoch seconds, an
 * ISO-8601 string, or a space-separated local datetime — all shapes the call
 * provider APIs have been seen to return.
 *
 * Returns null when the value cannot be read as a date, so a caller renders its
 * own placeholder rather than the string "Invalid Date".
 */
export function formatTimestamp(value?: number | string | null): string | null {
  // 0 is treated as absent rather than as the epoch: an unset sentinel is far
  // likelier here than a genuine 1970 timestamp, and "Jan 01, 1970" in a column
  // reads as data when it is the absence of data.
  if (value === null || value === undefined || value === "" || value === 0) return null;

  const numeric =
    typeof value === "number" ? value : /^\d+$/.test(value.trim()) ? Number(value.trim()) : null;

  let date: Date;
  if (numeric !== null) {
    // Seconds and milliseconds are both in the wild. Anything below this bound
    // is too small to be milliseconds for a date worth showing.
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    const text = String(value).trim();
    // "2026-09-08 14:23:11" does not parse everywhere; ISO wants the T.
    date = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:/.test(text) ? text.replace(" ", "T") : text);
  }

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDateRange(preset: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  let start: Date;
  let end: Date = endOfToday;

  switch (preset) {
    case 'Today':
      start = startOfToday;
      break;
    case 'Yesterday':
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      end.setHours(23, 59, 59);
      break;
    case 'This week': {
      const day = startOfToday.getDay();
      const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      start = new Date(startOfToday.setDate(diff));
      break;
    }
    case 'This month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'Last week': {
      const day = startOfToday.getDay();
      const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1) - 7;
      start = new Date(startOfToday.setDate(diff));
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59);
      break;
    }
    case 'Last month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'Last 7 Days':
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 6);
      break;
    case 'Last 30 Days':
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 29);
      break;
    case 'Last 4 Weeks':
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 27); // 28 days total
      break;
    case 'Last 60 Days':
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 59);
      break;
    case 'Last 6 Months':
      start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 6);
      break;
    default:
      start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 6); // Default to Last 6 Months
  }

  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000)
  };
}
