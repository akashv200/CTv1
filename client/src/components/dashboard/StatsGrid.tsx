import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, BadgeCheck, Boxes, Sparkles } from "lucide-react";
import Card from "../common/Card";
import { useChainTraceStore } from "../../store/useChainTraceStore";

export default function StatsGrid() {
  const products = useChainTraceStore((state) => state.products);
  const checkpoints = useChainTraceStore((state) => state.checkpoints);
  const insights = useChainTraceStore((state) => state.insights);

  const stats = useMemo(
    () => [
      { label: "Products Tracked", value: products.length.toLocaleString(), icon: Boxes, color: "#2563EB" },
      { label: "Verified Checkpoints", value: checkpoints.filter((checkpoint) => Boolean(checkpoint.txHash)).length.toLocaleString(), icon: BadgeCheck, color: "#10B981" },
      { label: "Active Checkpoints", value: checkpoints.length.toLocaleString(), icon: Activity, color: "#F97316" },
      { label: "Open AI Insights", value: insights.length.toLocaleString(), icon: Sparkles, color: "#8B5CF6" }
    ],
    [checkpoints, insights.length, products.length]
  );

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="h-full border-l-4" style={{ borderLeftColor: stat.color }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl p-3" style={{ background: `${stat.color}22` }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}
