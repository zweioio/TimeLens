import type { VisitLog } from '../types';
import { TagDatabase } from '../utils/tags';
import { formatShortDate } from './format';
import { getWeekdayLabel } from './date';

export interface DomainSummary {
  domain: string;
  duration: number;
  tags: string[];
}

export interface TagSummary {
  name: string;
  value: number;
}

export interface DaySummary {
  date: string;
  label: string;
  totalDuration: number;
  healthyDuration: number;
  unhealthyDuration: number;
}

export interface UsageSummary {
  totalDuration: number;
  healthyDuration: number;
  unhealthyDuration: number;
  healthyRate: number;
  topDomains: DomainSummary[];
  tagDurations: TagSummary[];
}

export const TAG_COLORS: Record<string, string> = {
  Work: '#3b82f6',
  AI: '#a855f7',
  Social: '#f97316',
  Entertainment: '#ef4444',
  Video: '#6366f1',
  Music: '#22c55e',
  Shopping: '#ec4899',
  Books: '#d97706',
  Tools: '#6b7280',
  Games: '#f43f5e',
  News: '#06b6d4',
  Photography: '#0ea5e9',
  Uncategorized: '#94a3b8'
};

export function summarizeLogs(logs: VisitLog[], topCount = 5): UsageSummary {
  let totalDuration = 0;
  let healthyDuration = 0;
  let unhealthyDuration = 0;
  const domainMap: Record<string, DomainSummary> = {};
  const tagMap: Record<string, number> = {};

  for (const log of logs) {
    totalDuration += log.duration;
    if (log.isHealthy) {
      healthyDuration += log.duration;
    } else {
      unhealthyDuration += log.duration;
    }

    if (!domainMap[log.domain]) {
      domainMap[log.domain] = {
        domain: log.domain,
        duration: 0,
        tags: log.tags?.length ? [...log.tags] : TagDatabase.getTags(log.domain).tags
      };
    }

    domainMap[log.domain].duration += log.duration;

    const primaryTag = log.tags?.[0] || 'Uncategorized';
    tagMap[primaryTag] = (tagMap[primaryTag] || 0) + log.duration;
  }

  return {
    totalDuration,
    healthyDuration,
    unhealthyDuration,
    healthyRate: totalDuration > 0 ? Math.round((healthyDuration / totalDuration) * 100) : 0,
    topDomains: Object.values(domainMap)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, topCount),
    tagDurations: Object.entries(tagMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  };
}

export function summarizeDailyLogs(logsByDate: Record<string, VisitLog[]>): DaySummary[] {
  return Object.entries(logsByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, logs]) => {
      const summary = summarizeLogs(logs);

      return {
        date,
        label: `${getWeekdayLabel(date)} ${formatShortDate(date)}`,
        totalDuration: summary.totalDuration,
        healthyDuration: summary.healthyDuration,
        unhealthyDuration: summary.unhealthyDuration
      };
    });
}

export function getDomainColor(domain: string): string {
  const presets: Record<string, string> = {
    'zhihu.com': '#0084FF',
    'xiaohongshu.com': '#FF2442',
    'bilibili.com': '#FB7299',
    'weibo.com': '#FF8200',
    'youtube.com': '#FF0000',
    'github.com': '#24292F',
    'figma.com': '#F24E1E'
  };

  const matched = Object.entries(presets).find(([key]) => domain.includes(key.replace('.com', '')));
  return matched?.[1] || '#94A3B8';
}

export function getDomainInitial(domain: string): string {
  const parts = domain.split('.');
  const name = parts[parts.length > 2 ? 1 : 0];
  if (!name) return 'W';

  const alias: Record<string, string> = {
    zhihu: '知',
    xiaohongshu: '红',
    bilibili: 'B',
    weibo: '微',
    youtube: 'Y',
    github: 'G',
    figma: 'F',
    baidu: '度',
    google: 'G'
  };

  return alias[name.toLowerCase()] || name.charAt(0).toUpperCase();
}
