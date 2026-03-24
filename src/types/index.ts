export interface DomainMeta {
  domain: string;
  tags: string[]; // e.g., ['Work', 'AI', 'Tools']
  primaryTag: string;
  isCustomized: boolean;
}

export interface VisitLog {
  id: string;
  date: string; // YYYY-MM-DD
  domain: string;
  duration: number; // seconds
  tags: string[]; // 快照当时的标签
  isHealthy: boolean;
  startTime: number;
  endTime: number;
}
