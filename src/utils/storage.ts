import { VisitLog } from '../types';
import { TagDatabase } from './tags';

export class StorageManager {
  private static LOGS_KEY_PREFIX = 'timelens_logs_';

  /**
   * 获取今天的日期字符串 (格式: YYYY-MM-DD)
   */
  private static getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * 生成日志的唯一 ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * 记录一次网站访问
   * @param domain 访问的域名
   * @param duration 停留时长（秒）
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   */
  public static async logVisit(
    domain: string,
    duration: number,
    startTime: number,
    endTime: number
  ): Promise<void> {
    if (!domain || duration <= 0) return;

    const today = this.getTodayString();
    const storageKey = `${this.LOGS_KEY_PREFIX}${today}`;
    
    // 获取该域名的标签信息
    const { tags } = TagDatabase.getTags(domain);
    
    // TODO: 后续接入健康算法判定 (health-algorithm.ts)
    // 暂时默认：包含 Work/AI/Books 的为健康，包含 Social/Entertainment/Games 的且超过20分钟的为不健康
    const isHealthy = !tags.some(tag => ['Social', 'Entertainment', 'Games'].includes(tag)) || duration < 20 * 60;

    const newLog: VisitLog = {
      id: this.generateId(),
      date: today,
      domain,
      duration,
      tags,
      isHealthy,
      startTime,
      endTime
    };

    try {
      // 1. 获取当天的已有日志
      const result = await chrome.storage.local.get(storageKey);
      const existingLogs: VisitLog[] = (result[storageKey] as VisitLog[]) || [];

      // 2. 将新日志加入数组
      existingLogs.push(newLog);

      // 3. 保存回 storage
      await chrome.storage.local.set({ [storageKey]: existingLogs });
      
      console.log(`[TimeLens] 成功记录访问: ${domain}, 时长: ${duration}s`);
    } catch (error) {
      console.error('[TimeLens] 保存访问日志失败:', error);
    }
  }

  /**
   * 获取指定日期的所有访问日志
   * @param date 日期字符串 YYYY-MM-DD，不传则默认今天
   */
  public static async getLogsByDate(date?: string): Promise<VisitLog[]> {
    const targetDate = date || this.getTodayString();
    const storageKey = `${this.LOGS_KEY_PREFIX}${targetDate}`;
    
    try {
      const result = await chrome.storage.local.get(storageKey);
      return (result[storageKey] as VisitLog[]) || [];
    } catch (error) {
      console.error('[TimeLens] 获取访问日志失败:', error);
      return [];
    }
  }
}
