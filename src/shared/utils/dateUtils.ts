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
