import { useEffect, useMemo, useState } from 'react';
import type { VisitLog } from '../types';
import { getPastDateKeys } from '../lib/date';
import { summarizeDailyLogs, summarizeLogs } from '../lib/analytics';
import { StorageManager } from '../utils/storage';

export function useDashboardData(days = 7) {
  const [todayLogs, setTodayLogs] = useState<VisitLog[]>([]);
  const [logsByDate, setLogsByDate] = useState<Record<string, VisitLog[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const dateKeys = getPastDateKeys(days);
        const dailyEntries = await Promise.all(
          dateKeys.map(async (date) => [date, await StorageManager.getLogsByDate(date)] as const)
        );

        if (!isMounted) return;

        const nextLogsByDate = Object.fromEntries(dailyEntries);
        setLogsByDate(nextLogsByDate);
        setTodayLogs(nextLogsByDate[dateKeys[dateKeys.length - 1]] || []);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : '数据加载失败');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [days]);

  const todaySummary = useMemo(() => summarizeLogs(todayLogs, 5), [todayLogs]);
  const dailySummary = useMemo(() => summarizeDailyLogs(logsByDate), [logsByDate]);

  return {
    todayLogs,
    logsByDate,
    todaySummary,
    dailySummary,
    isLoading,
    error
  };
}
