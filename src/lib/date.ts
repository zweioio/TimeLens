export function getDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getPastDateKeys(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - (days - index - 1));
    return getDateKey(current);
  });
}

export function getWeekdayLabel(date: string): string {
  const current = new Date(`${date}T00:00:00`);
  return current.toLocaleDateString('zh-CN', { weekday: 'short' });
}
