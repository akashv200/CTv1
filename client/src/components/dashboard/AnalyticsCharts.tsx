import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Card from "../common/Card";
import { domains } from "../../data/domainConfig";
import { useChainTraceStore } from "../../store/useChainTraceStore";

interface ThroughputPoint {
  day: string;
  key: string;
  checkpoints: number;
  tx: number;
  anomalies: number;
}

export default function AnalyticsCharts() {
  const products = useChainTraceStore((state) => state.products);
  const checkpoints = useChainTraceStore((state) => state.checkpoints);

  const throughput = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
    const now = new Date();
    const points: ThroughputPoint[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const dayKey = date.toISOString().slice(0, 10);
      return {
        day: formatter.format(date),
        key: dayKey,
        checkpoints: 0,
        tx: 0,
        anomalies: 0
      };
    });

    const indexByKey = new Map(points.map((point) => [point.key, point]));
    checkpoints.forEach((checkpoint) => {
      const dayKey = new Date(checkpoint.timestamp).toISOString().slice(0, 10);
      const bucket = indexByKey.get(dayKey);
      if (!bucket) return;
      bucket.checkpoints += 1;
      if (checkpoint.txHash) bucket.tx += 1;
      if (checkpoint.note) bucket.anomalies += 1;
    });

    return points.map(({ key: _key, ...point }) => point);
  }, [checkpoints]);

  const domainSplit = useMemo(
    () =>
      domains
        .map((domain) => ({
          name: domain.name,
          value: products.filter((product) => product.domain === domain.key).length,
          color: domain.accent
        }))
        .filter((item) => item.value > 0),
    [products]
  );

  const hasThroughputData = throughput.some((point) => point.checkpoints > 0 || point.tx > 0);
  const hasDomainData = domainSplit.length > 0;
  const hasRiskData = throughput.some((point) => point.anomalies > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="h-[360px]">
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Checkpoint Throughput</h3>
        {hasThroughputData ? (
          <ResponsiveContainer width="100%" height="91%">
            <LineChart data={throughput}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="checkpoints" stroke="#2563EB" strokeWidth={2.5} />
              <Line type="monotone" dataKey="tx" stroke="#10B981" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[91%] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            No checkpoint data available yet.
          </div>
        )}
      </Card>

      <Card className="h-[360px]">
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Domain Distribution</h3>
        {hasDomainData ? (
          <ResponsiveContainer width="100%" height="91%">
            <PieChart>
              <Pie data={domainSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={108} label>
                {domainSplit.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[91%] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            No product distribution data available yet.
          </div>
        )}
      </Card>

      <Card className="h-[360px] xl:col-span-2">
        <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Anomaly Risk Trend</h3>
        {hasRiskData ? (
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={throughput}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F9FAFB" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="anomalies" stroke="#EF4444" fill="url(#riskGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-[90%] place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            No anomaly signals detected yet.
          </div>
        )}
      </Card>
    </div>
  );
}
