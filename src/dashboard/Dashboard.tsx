import React from 'react';
import { Activity, Clock3, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EmptyState } from '@/components/app/empty-state';
import { MetricCard } from '@/components/app/metric-card';
import { useDashboardData } from '../hooks/use-dashboard-data';
import { TAG_COLORS } from '../lib/analytics';
import { formatDurationCN, formatDurationCompact } from '../lib/format';

const LoadingDashboard = () => (
  <div className="min-h-screen bg-[#F8FAFC]">
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-8 px-8 py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="rounded-3xl">
            <CardContent className="flex items-center gap-5 p-6">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="mb-6 h-6 w-40" />
            <Skeleton className="h-[320px] w-full rounded-2xl" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-6">
            <Skeleton className="mb-6 h-6 w-32" />
            <Skeleton className="h-[320px] w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
);

export const Dashboard: React.FC = () => {
  const { todaySummary, dailySummary, isLoading, error } = useDashboardData(7);
  const maxDailyDuration = Math.max(...dailySummary.map((item) => item.totalDuration), 1);

  if (isLoading) return <LoadingDashboard />;

  const topShare = (duration: number) =>
    todaySummary.totalDuration > 0 ? Math.round((duration / todaySummary.totalDuration) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans text-gray-800">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-blue-200/60">
              <Eye size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">TimeLens</h1>
              <p className="text-xs font-medium text-muted-foreground">重构后的全局数据面板</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              今日概览
            </Badge>
            <Button variant="outline" className="rounded-full bg-white">
              今日共 {todaySummary.topDomains.length} 个站点
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-8 py-8">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard
            icon={<Clock3 size={28} />}
            title="今日总时长"
            description="基于今天的所有访问记录自动统计"
            value={formatDurationCompact(todaySummary.totalDuration)}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <MetricCard
            icon={<Activity size={28} />}
            title="健康用眼"
            value={formatDurationCompact(todaySummary.healthyDuration)}
            iconClassName="bg-emerald-50 text-emerald-600"
            extra={<Progress value={todaySummary.healthyRate} className="h-2 bg-emerald-100" />}
          />

          <MetricCard
            icon={<ShieldAlert size={28} />}
            title="疲劳用眼"
            value={formatDurationCompact(todaySummary.unhealthyDuration)}
            iconClassName="bg-rose-50 text-rose-600"
            extra={<Progress value={100 - todaySummary.healthyRate} className="h-2 bg-rose-100" />}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="rounded-3xl border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.05)] lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock3 size={18} className="text-muted-foreground" />
                    近 7 天用眼趋势
                  </CardTitle>
                  <CardDescription>按分钟统计健康与疲劳用眼堆叠趋势</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  最近 7 天
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {dailySummary.length === 0 ? (
                <EmptyState title="暂无趋势数据" description="产生浏览记录后，这里会显示最近 7 天趋势" />
              ) : (
                <div className="space-y-4">
                  {dailySummary.map((item, index) => {
                    const totalHeight = Math.max(10, Math.round((item.totalDuration / maxDailyDuration) * 100));
                    const healthyPercent =
                      item.totalDuration > 0
                        ? Math.round((item.healthyDuration / item.totalDuration) * 100)
                        : 0;

                    return (
                      <div key={item.date} className="grid grid-cols-[84px_1fr_64px] items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium text-foreground">{index === dailySummary.length - 1 ? '今日' : item.label.split(' ')[0]}</div>
                          <div className="text-xs">{item.label.split(' ')[1]}</div>
                        </div>
                        <div className="rounded-full bg-slate-100 p-1">
                          <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="bg-emerald-400"
                              style={{ width: `${Math.max(0, Math.min(healthyPercent, totalHeight))}%` }}
                            />
                            <div
                              className="bg-rose-400"
                              style={{ width: `${Math.max(0, totalHeight - Math.min(healthyPercent, totalHeight))}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm font-medium text-foreground">
                          {formatDurationCompact(item.totalDuration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">今日时间去向</CardTitle>
              <CardDescription>按标签查看今天的网页时长分布</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {todaySummary.tagDurations.length > 0 ? (
                todaySummary.tagDurations.map((tag) => {
                  const width = todaySummary.totalDuration > 0 ? Math.round((tag.value / todaySummary.totalDuration) * 100) : 0;
                  return (
                    <div key={tag.name} className="space-y-2 rounded-2xl bg-muted/40 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TAG_COLORS[tag.name] || TAG_COLORS.Uncategorized }} />
                          {tag.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{formatDurationCompact(tag.value)}</div>
                      </div>
                      <Progress value={width} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <EmptyState title="暂无标签数据" description="开始使用后，这里会按标签聚合时间" />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-3xl border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle className="text-lg">今日常访网站 Top 5</CardTitle>
              <CardDescription>访问频率最高的网站与时长占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>网站</TableHead>
                      <TableHead>停留时长</TableHead>
                      <TableHead className="w-[38%]">时长占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySummary.topDomains.length > 0 ? todaySummary.topDomains.map((site, index) => (
                      <TableRow key={site.domain}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{site.domain}</div>
                            <div className="flex flex-wrap gap-1">
                              {site.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-700">{formatDurationCN(site.duration)}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Progress value={topShare(site.duration)} className="h-2" />
                            <div className="text-xs text-muted-foreground">{topShare(site.duration)}%</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                          暂无访问记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">健康建议</CardTitle>
              <CardDescription>根据今天的浏览情况给出快速提醒</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="text-sm text-muted-foreground">健康用眼占比</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{todaySummary.healthyRate}%</div>
                <div className="mt-3">
                  <Progress value={todaySummary.healthyRate} className="h-2" />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-900">
                  <ShieldAlert className="h-4 w-4" />
                  提醒
                </div>
                <p className="text-sm leading-6 text-amber-800">
                  如果今天的不健康用眼时长偏高，建议把社交和娱乐网站拆成更短的浏览片段。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {todaySummary.tagDurations.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor: `${TAG_COLORS[tag.name] || TAG_COLORS.Uncategorized}18`,
                      color: TAG_COLORS[tag.name] || TAG_COLORS.Uncategorized
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  数据读取异常：{error}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
