/**
 * date-buckets — group items by relative date: today / yesterday / last 7 days / older.
 * Locale-aware day boundaries to avoid raw subtraction edge cases.
 */
export type DateBucket = 'today' | 'yesterday' | 'last7Days' | 'older';

export interface BucketGroups<T> {
  today: T[];
  yesterday: T[];
  last7Days: T[];
  older: T[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

export function bucketByDate<T>(
  items: T[],
  getDate: (item: T) => string | number | Date,
): BucketGroups<T> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - DAY_MS;
  const sevenAgoStart = todayStart - 7 * DAY_MS;

  const groups: BucketGroups<T> = {
    today: [], yesterday: [], last7Days: [], older: [],
  };

  for (const item of items) {
    const ts = new Date(getDate(item)).getTime();
    if (ts >= todayStart) groups.today.push(item);
    else if (ts >= yesterdayStart) groups.yesterday.push(item);
    else if (ts >= sevenAgoStart) groups.last7Days.push(item);
    else groups.older.push(item);
  }
  return groups;
}

export const BUCKET_LABELS: Record<DateBucket, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 days',
  older: 'Older',
};
