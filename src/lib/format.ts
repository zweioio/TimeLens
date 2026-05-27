export function formatDurationCN(seconds: number): string {
  if (seconds < 60) return '小于1分钟';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }

  return `${minutes}分钟`;
}

export function formatDurationCompact(seconds: number): string {
  if (seconds < 60) return '< 1m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function formatShortDate(date: string): string {
  return date.slice(5);
}
