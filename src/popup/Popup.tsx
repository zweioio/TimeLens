import React, { useEffect, useState, useMemo } from 'react';
import { StorageManager } from '../utils/storage';
import { VisitLog } from '../types';

// 标签颜色映射配置 (根据 PRD 3.1.1 预设标签体系)
const TAG_COLORS: Record<string, string> = {
  'Work': 'bg-blue-100 text-blue-700',
  'AI': 'bg-purple-100 text-purple-700',
  'Social': 'bg-orange-100 text-orange-700',
  'Entertainment': 'bg-red-100 text-red-700',
  'Video': 'bg-indigo-100 text-indigo-700',
  'Music': 'bg-green-100 text-green-700',
  'Shopping': 'bg-pink-100 text-pink-700',
  'Books': 'bg-amber-100 text-amber-700',
  'Tools': 'bg-gray-100 text-gray-700',
  'Games': 'bg-rose-100 text-rose-700',
  'News': 'bg-cyan-100 text-cyan-700',
  'Photography': 'bg-sky-100 text-sky-700'
};

// 默认未匹配到的标签颜色
const DEFAULT_TAG_COLOR = 'bg-gray-100 text-gray-600';

// 辅助函数：将秒格式化为 hh:mm 格式
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return '< 1m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// --- 组件部分 ---

export const Popup: React.FC = () => {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化获取今天的数据
  useEffect(() => {
    const fetchTodayLogs = async () => {
      setIsLoading(true);
      // 获取今天的数据，实际运行中由于在 Chrome 插件环境，直接调用我们写的 StorageManager
      const todayLogs = await StorageManager.getLogsByDate();
      setLogs(todayLogs);
      setIsLoading(false);
    };
    fetchTodayLogs();
  }, []);

  // 计算聚合数据
  const { totalDuration, healthyDuration, unhealthyDuration, aggregatedDomains, allTags } = useMemo(() => {
    let total = 0;
    let healthy = 0;
    let unhealthy = 0;
    const domainMap: Record<string, { duration: number, tags: string[] }> = {};
    const tagsSet = new Set<string>();

    logs.forEach(log => {
      // 计算时长
      total += log.duration;
      if (log.isHealthy) {
        healthy += log.duration;
      } else {
        unhealthy += log.duration;
      }

      // 聚合按域名计算总时长和标签
      if (!domainMap[log.domain]) {
        domainMap[log.domain] = { duration: 0, tags: log.tags || [] };
      }
      domainMap[log.domain].duration += log.duration;

      // 收集出现过的所有标签
      (log.tags || []).forEach(tag => tagsSet.add(tag));
    });

    // 转换为数组并按时长降序排序
    const sortedDomains = Object.entries(domainMap)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.duration - a.duration);

    return {
      totalDuration: total,
      healthyDuration: healthy,
      unhealthyDuration: unhealthy,
      aggregatedDomains: sortedDomains,
      allTags: Array.from(tagsSet).sort()
    };
  }, [logs]);

  // 根据选中的标签筛选列表
  const filteredDomains = useMemo(() => {
    if (!selectedTag) return aggregatedDomains;
    return aggregatedDomains.filter(item => item.tags.includes(selectedTag));
  }, [aggregatedDomains, selectedTag]);

  // 计算健康进度条百分比
  const healthyPercentage = totalDuration > 0 ? (healthyDuration / totalDuration) * 100 : 0;
  const unhealthyPercentage = totalDuration > 0 ? (unhealthyDuration / totalDuration) * 100 : 0;

  return (
    <div className="w-[380px] h-[520px] bg-gray-50 flex flex-col font-sans overflow-hidden text-gray-800">
      
      {/* 顶部标题栏 */}
      <header className="px-5 py-4 bg-white flex justify-between items-center shadow-sm z-10 relative">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span className="text-xl">⏱️</span> TimeLens
        </h1>
        <button 
          className="text-xs text-gray-500 hover:text-blue-600 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          查看完整仪表盘
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
        
        {/* 1. 顶部卡片：今日概览与健康模型 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">今日屏幕使用</p>
              <h2 className="text-3xl font-bold text-gray-900">{formatDuration(totalDuration)}</h2>
            </div>
            {/* 用眼健康提示小标签 */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${healthyPercentage >= 60 || totalDuration === 0 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
              {healthyPercentage >= 60 || totalDuration === 0 ? '🌿 状态良好' : '⚠️ 注意休息'}
            </div>
          </div>

          {/* 简易健康状态进度条 (Progress Bar) */}
          <div className="space-y-2 mt-5">
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${healthyPercentage}%` }} 
                title="健康用眼"
              />
              <div 
                className="h-full bg-rose-400 transition-all duration-500" 
                style={{ width: `${unhealthyPercentage}%` }}
                title="疲劳/不健康用眼"
              />
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                健康 {formatDuration(healthyDuration)}
              </span>
              <span className="text-rose-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                疲劳 {formatDuration(unhealthyDuration)}
              </span>
            </div>
          </div>
        </section>

        {/* 2. 标签过滤器 (横向滚动) */}
        {allTags.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">标签分类</h3>
              {selectedTag && (
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  清除筛选
                </button>
              )}
            </div>
            <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar -mx-5 px-5">
              {allTags.map(tag => {
                const isSelected = selectedTag === tag;
                const baseColorClass = TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
                // 如果选中，则加深边框和背景；如果未选中，则使用柔和样式
                const styleClass = isSelected 
                  ? 'ring-2 ring-blue-400 ring-offset-1 bg-white shadow-sm' 
                  : `opacity-80 hover:opacity-100 ${baseColorClass}`;

                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${styleClass}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. 网站时长明细列表 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedTag ? `包含 [${selectedTag}] 的网站` : '所有网站'}
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">加载数据中...</div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-400 text-sm">
              暂无记录，去冲浪一会儿吧 🏄‍♂️
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDomains.map(({ domain, duration, tags }) => (
                <div key={domain} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-100 transition-colors">
                  
                  {/* 左侧：Favicon + 域名 + 标签 */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} 
                      alt="" 
                      className="w-8 h-8 rounded-md bg-gray-50 p-0.5 object-contain flex-shrink-0"
                      onError={(e) => (e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JjYmNiIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+')}
                    />
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-medium text-gray-900 truncate" title={domain}>{domain}</p>
                      <div className="flex gap-1.5 mt-1 overflow-hidden">
                        {tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-md ${TAG_COLORS[tag] || DEFAULT_TAG_COLOR} truncate`}>
                            {tag}
                          </span>
                        ))}
                        {tags.length > 2 && <span className="text-[10px] text-gray-400 px-1">+{tags.length - 2}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：时长与占比条 */}
                  <div className="flex flex-col items-end flex-shrink-0 ml-3">
                    <span className="text-sm font-bold text-gray-700">{formatDuration(duration)}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${(duration / totalDuration) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Popup;
