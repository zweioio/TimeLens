import React from 'react';
import {
  Activity,
  Clock3,
  ExternalLink,
  HeartPulse,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/app/empty-state';
import { useDashboardData } from '../hooks/use-dashboard-data';
import { getDomainColor, getDomainInitial } from '../lib/analytics';
import { formatDurationCN } from '../lib/format';

export const Popup: React.FC = () => {
  const { todaySummary, dailySummary, isLoading } = useDashboardData(7);
  const topDomains = todaySummary.topDomains.slice(0, 4);

  const openDashboard = async () => {
    try {
      if (chrome.runtime?.openOptionsPage) {
        await chrome.runtime.openOptionsPage();
        return;
      }
    } catch (error) {
      console.warn('[TimeLens] openOptionsPage failed, fallback to tabs.create', error);
    }

    const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html');
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url: dashboardUrl });
      return;
    }

    window.open(dashboardUrl, '_blank');
  };

  return (
    <div className="custom-scrollbar h-screen w-full overflow-y-auto bg-[#F7F7F7] p-3 font-['MiSans',-apple-system,BlinkMacSystemFont,'Inter',sans-serif]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="space-y-1">
            <h1 className="text-[20px] font-semibold tracking-tight text-[#000000]">
              健康浏览网页
            </h1>
            <p className="text-xs text-muted-foreground">
              重构后的统一侧边栏视图
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-full bg-white px-3">
                  健康建议
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[360px] rounded-2xl border-white/60 bg-white/95">
                <DialogHeader>
                  <DialogTitle>今日浏览摘要</DialogTitle>
                  <DialogDescription>
                    这里会根据今天的浏览记录，给你一个快速总结。
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="text-xs text-muted-foreground">健康占比</div>
                    <div className="mt-2 text-2xl font-semibold">{todaySummary.healthyRate}%</div>
                  </div>

                  <div className="rounded-2xl border border-border/80 p-4">
                    <div className="mb-2 text-sm font-medium">前 4 个高频网站</div>
                    <div className="space-y-2">
                      {topDomains.length === 0 ? (
                        <div className="text-sm text-muted-foreground">今天还没有浏览记录</div>
                      ) : (
                        topDomains.map((site) => (
                          <div key={site.domain} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-foreground">{site.domain}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {formatDurationCN(site.duration)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={openDashboard} className="w-full rounded-xl">
                    打开完整仪表盘
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="rounded-3xl border-white/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-[#111111]">今日网页使用时长</CardTitle>
                  <CardDescription>Top 4 网站与近 7 天趋势预览</CardDescription>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full bg-white px-3"
                onClick={openDashboard}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                仪表盘
              </Button>
            </div>

            <div className="rounded-[22px] bg-[#F8FAFC] p-4">
              <div className="text-[12px] text-[#64748B]">今日累计</div>
              <div className="mt-2 text-[28px] font-semibold leading-none text-[#0F172A]">
                {formatDurationCN(todaySummary.totalDuration)}
              </div>
              <div className="mt-2 text-[12px] text-[#94A3B8]">基于最近 7 天浏览记录自动汇总</div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-[22px] border border-border/70 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-[#0F172A]">近 7 天趋势</span>
              </div>

              <div className="relative h-[150px]">
                <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
                  <div className="border-t border-dashed border-[#E2E8F0]"></div>
                  <div className="border-t border-dashed border-[#E2E8F0]"></div>
                  <div className="border-t border-dashed border-[#E2E8F0]"></div>
                </div>

                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between gap-2">
                  {dailySummary.map((item, index) => {
                    const maxDuration = Math.max(...dailySummary.map((day) => day.totalDuration), 1);
                    const height = Math.max(16, Math.round((item.totalDuration / maxDuration) * 100));
                    const isToday = index === dailySummary.length - 1;
                    return (
                      <div key={item.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                        <div className="flex h-[118px] items-end">
                          <div
                            className={`w-4 rounded-t-full ${
                              isToday ? 'bg-primary' : 'bg-primary/35'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span
                          className={`text-[11px] ${isToday ? 'font-medium text-[#0F172A]' : 'text-[#94A3B8]'}`}
                          title={item.date}
                        >
                          {isToday ? '今日' : item.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-[#111111]">网页使用时长</h2>
                <span className="text-xs text-muted-foreground">最近使用最多的 4 个</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isLoading ? (
                  <div className="col-span-2">
                    <EmptyState title="加载中" description="正在整理今天的网页时长..." />
                  </div>
                ) : topDomains.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState title="暂无记录" description="今天还没有产生可展示的网页时长" />
                  </div>
                ) : (
                  topDomains.map((site) => (
                    <Card key={site.domain} className="rounded-2xl border-white/70 bg-[#FCFCFD] shadow-none">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                          style={{ backgroundColor: getDomainColor(site.domain) }}
                        >
                          {getDomainInitial(site.domain)}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xs text-[#94A3B8]" title={site.domain}>
                            {site.domain.replace('www.', '')}
                          </div>
                          <div className="mt-1 text-sm font-medium text-[#111827]">
                            {formatDurationCN(site.duration)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base text-[#111111]">今日屏幕使用时长</CardTitle>
                <CardDescription>健康与不健康用眼分布</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-[22px] bg-[#F8FAFC] p-4">
              <div className="text-[12px] text-[#64748B]">总屏幕时长</div>
              <div className="mt-2 text-[28px] font-semibold leading-none text-[#0F172A]">
                {formatDurationCN(todaySummary.totalDuration)}
              </div>
            </div>

            <div className="space-y-4 rounded-[22px] border border-border/70 bg-white p-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                    健康用眼
                  </div>
                  <span className="font-medium text-[#111827]">{formatDurationCN(todaySummary.healthyDuration)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#E8F5EC]">
                  <div
                    className="h-2 rounded-full bg-[#22C55E]"
                    style={{ width: `${todaySummary.healthyRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF622F]" />
                    不健康用眼
                  </div>
                  <span className="font-medium text-[#111827]">{formatDurationCN(todaySummary.unhealthyDuration)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#FDECE6]">
                  <div
                    className="h-2 rounded-full bg-[#FF622F]"
                    style={{ width: `${100 - todaySummary.healthyRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-amber-900">今日提醒</div>
                <div className="mt-1 text-xs leading-5 text-amber-700">
                  如果连续浏览时间偏长，建议每 20 分钟起身休息一下，让眼睛离开屏幕。
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Popup;
