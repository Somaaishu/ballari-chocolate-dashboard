import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IndianRupee,
  Package,
  Sparkles,
  Tag,
  RotateCcw,
  TrendingUp,
  Trophy,
  Store,
  CreditCard,
  MapPin,
  Lightbulb,
  Megaphone,
  CalendarDays,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAME_TO_SHORT = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};
const BRAND_COLORS = ["#d4870a", "#e85d04", "#9b2226", "#606c38", "#3d405b", "#4cc9f0", "#f72585", "#7b2d8b", "#2dc653", "#ff9f1c"];
const OCCASION_COLORS = ["#d4870a", "#f59e0b", "#f97316", "#fb7185", "#a855f7", "#22d3ee"];
const TYPE_COLORS = {
  Wafer: "#d4870a",
  Milk: "#f59e0b",
  Caramel: "#e85d04",
  White: "#fef3c7",
  Dark: "#7b2d8b",
  Toffee: "#2dc653",
};

const formatterINR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const compactINR = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

const parseNum = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);
const inr = (v) => `₹${formatterINR.format(parseNum(v))}`;
const compactRupee = (v) => `₹${compactINR.format(parseNum(v))}`;

function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = null;
    const start = performance.now();
    const begin = display;
    const diff = value - begin;
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      setDisplay(begin + diff * p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => frame && cancelAnimationFrame(frame);
  }, [value]);
  return display;
}

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-amber-900/40 bg-[color:var(--bg-card)]/65 p-4 shadow-[0_0_40px_rgba(212,135,10,0.08)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_45px_rgba(212,135,10,0.18)] ${className}`}
  >
    {children}
  </div>
);

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-amber-700/50 bg-[#1c0d02]/95 p-3 text-xs text-[var(--text-primary)] shadow-xl">
      {label !== undefined && <p className="mb-2 font-semibold text-[var(--accent-amber)]">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="mb-1">
          <span style={{ color: entry.color || "#f59e0b" }}>{entry.name}:</span>{" "}
          {typeof entry.value === "number" ? formatterINR.format(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ month: "", storeType: "", brand: "", segment: "" });
  const [sortBy, setSortBy] = useState("totalRevenue");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');";
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    Papa.parse("/ballari_chocolate_sales.csv", {
      header: true,
      dynamicTyping: true,
      download: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const clean = data
          .map((r) => ({
            ...r,
            temperature_celsius: parseNum(r.temperature_celsius),
            unit_price_inr: parseNum(r.unit_price_inr),
            discount_percent: parseNum(r.discount_percent),
            price_after_discount: parseNum(r.price_after_discount),
            quantity_sold: parseNum(r.quantity_sold),
            total_revenue_inr: parseNum(r.total_revenue_inr),
            customer_satisfaction: parseNum(r.customer_satisfaction),
            is_weekend: String(r.is_weekend).toLowerCase() === "true" || r.is_weekend === 1,
            is_festival_month: String(r.is_festival_month).toLowerCase() === "true" || r.is_festival_month === 1,
          }))
          .filter((r) => r.sale_id);
        setRows(clean);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  }, []);

  const options = useMemo(() => {
    const uniq = (k) => [...new Set(rows.map((r) => r[k]).filter(Boolean))];
    return {
      months: MONTHS.filter((m) => rows.some((r) => (MONTH_NAME_TO_SHORT[r.month_name] || r.month_name || r.month) === m)),
      storeTypes: uniq("store_type"),
      brands: uniq("brand"),
      segments: uniq("customer_segment"),
    };
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const m = MONTH_NAME_TO_SHORT[r.month_name] || r.month_name || r.month;
        return (
          (!filters.month || m === filters.month) &&
          (!filters.storeType || r.store_type === filters.storeType) &&
          (!filters.brand || r.brand === filters.brand) &&
          (!filters.segment || r.customer_segment === filters.segment)
        );
      }),
    [rows, filters]
  );

  const kpis = useMemo(() => {
    const totalRevenue = filtered.reduce((s, r) => s + r.total_revenue_inr, 0);
    const units = filtered.reduce((s, r) => s + r.quantity_sold, 0);
    const avgSat = filtered.length ? filtered.reduce((s, r) => s + r.customer_satisfaction, 0) / filtered.length : 0;
    const avgDisc = filtered.length ? filtered.reduce((s, r) => s + r.discount_percent, 0) / filtered.length : 0;
    return { totalRevenue, units, avgSat, avgDisc };
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const map = Object.fromEntries(MONTHS.map((m) => [m, { month: m, revenue: 0, festival: false }]));
    filtered.forEach((r) => {
      const key = MONTH_NAME_TO_SHORT[r.month_name] || r.month_name || r.month;
      if (!map[key]) return;
      map[key].revenue += r.total_revenue_inr;
      if (r.is_festival_month || ["Diwali", "Dasara", "Christmas"].includes(r.festival_name)) map[key].festival = true;
    });
    return MONTHS.map((m) => map[m]);
  }, [filtered]);

  const brandData = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      map[r.brand] ??= { brand: r.brand, revenue: 0, qty: 0 };
      map[r.brand].revenue += r.total_revenue_inr;
      map[r.brand].qty += r.quantity_sold;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const storeShare = useMemo(() => {
    const map = {};
    filtered.forEach((r) => (map[r.store_type] = (map[r.store_type] || 0) + r.total_revenue_inr));
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map).map(([name, value]) => ({ name, value, pct: (value * 100) / total }));
  }, [filtered]);

  const segmentOccasion = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      map[r.customer_segment] ??= { customer_segment: r.customer_segment };
      map[r.customer_segment][r.purchase_occasion] = (map[r.customer_segment][r.purchase_occasion] || 0) + r.total_revenue_inr;
    });
    return Object.values(map);
  }, [filtered]);

  const occasions = useMemo(() => [...new Set(filtered.map((r) => r.purchase_occasion).filter(Boolean))], [filtered]);

  const scatterByType = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      map[r.chocolate_type] ??= [];
      map[r.chocolate_type].push({ temperature: r.temperature_celsius, revenue: r.total_revenue_inr });
    });
    return map;
  }, [filtered]);

  const trendLine = useMemo(() => {
    const points = filtered.map((r) => ({ x: r.temperature_celsius, y: r.total_revenue_inr }));
    if (points.length < 2) return [];
    const n = points.length;
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (!denom) return [];
    const m = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;
    const xMin = Math.min(...points.map((p) => p.x));
    const xMax = Math.max(...points.map((p) => p.x));
    return [
      { temperature: xMin, revenue: m * xMin + b },
      { temperature: xMax, revenue: m * xMax + b },
    ];
  }, [filtered]);

  const insights = useMemo(() => {
    const topBrand = brandData[0];
    const bestMonth = [...monthlyTrend].sort((a, b) => b.revenue - a.revenue)[0];
    const bestStore = [...storeShare].sort((a, b) => b.value - a.value)[0];
    const payMap = {};
    filtered.forEach((r) => (payMap[r.payment_mode] = (payMap[r.payment_mode] || 0) + 1));
    const topPay = Object.entries(payMap).sort((a, b) => b[1] - a[1])[0];
    const payPct = topPay ? (topPay[1] * 100) / filtered.length : 0;
    const fest = filtered.filter((r) => r.is_festival_month);
    const nonFest = filtered.filter((r) => !r.is_festival_month);
    const festAvg = fest.length ? fest.reduce((s, r) => s + r.total_revenue_inr, 0) / fest.length : 0;
    const nonFestAvg = nonFest.length ? nonFest.reduce((s, r) => s + r.total_revenue_inr, 0) / nonFest.length : 0;
    const uplift = nonFestAvg ? ((festAvg - nonFestAvg) * 100) / nonFestAvg : 0;
    const satByStore = {};
    filtered.forEach((r) => {
      satByStore[r.store_type] ??= { total: 0, count: 0 };
      satByStore[r.store_type].total += r.customer_satisfaction;
      satByStore[r.store_type].count += 1;
    });
    const satLeader = Object.entries(satByStore)
      .map(([store, v]) => ({ store, score: v.total / v.count }))
      .sort((a, b) => b.score - a.score)[0];
    return { topBrand, bestMonth, bestStore, topPay, payPct, uplift, satLeader };
  }, [brandData, monthlyTrend, storeShare, filtered]);

  const growth = useMemo(() => {
    const bins = [
      { key: "0-5", min: 0, max: 5, revenue: 0 },
      { key: "6-10", min: 6, max: 10, revenue: 0 },
      { key: "11-15", min: 11, max: 15, revenue: 0 },
      { key: "16-20", min: 16, max: 20, revenue: 0 },
      { key: "21+", min: 21, max: 100, revenue: 0 },
    ];
    filtered.forEach((r) => {
      const hit = bins.find((b) => r.discount_percent >= b.min && r.discount_percent <= b.max);
      if (hit) hit.revenue += r.total_revenue_inr;
    });
    const bestBin = [...bins].sort((a, b) => b.revenue - a.revenue)[0];
    const weekend = filtered.filter((r) => r.is_weekend).reduce((s, r) => s + r.total_revenue_inr, 0);
    const weekday = filtered.filter((r) => !r.is_weekend).reduce((s, r) => s + r.total_revenue_inr, 0);
    const segMap = {};
    filtered.forEach((r) => {
      segMap[r.customer_segment] ??= { sat: 0, c: 0, occ: {} };
      segMap[r.customer_segment].sat += r.customer_satisfaction;
      segMap[r.customer_segment].c += 1;
      segMap[r.customer_segment].occ[r.purchase_occasion] = (segMap[r.customer_segment].occ[r.purchase_occasion] || 0) + 1;
    });
    const lowSegments = Object.entries(segMap)
      .map(([segment, v]) => ({
        segment,
        sat: v.sat / v.c,
        topOccasion: Object.entries(v.occ).sort((a, b) => b[1] - a[1])[0]?.[0] || "Regular Purchase",
      }))
      .sort((a, b) => a.sat - b.sat)
      .slice(0, 2);
    return { bins, bestBin, weekend, weekday, lowSegments };
  }, [filtered]);

  const salesPlaybook = useMemo(() => {
    if (!filtered.length) {
      return [];
    }

    const byOccasion = {};
    const bySegmentRevenue = {};
    const byStoreRevenue = {};
    const byBrand = {};
    const byPayment = {};
    let hotRevenue = 0;
    let coolRevenue = 0;
    let hotCount = 0;
    let coolCount = 0;

    filtered.forEach((r) => {
      byOccasion[r.purchase_occasion] = (byOccasion[r.purchase_occasion] || 0) + r.total_revenue_inr;
      bySegmentRevenue[r.customer_segment] = (bySegmentRevenue[r.customer_segment] || 0) + r.total_revenue_inr;
      byStoreRevenue[r.store_type] = (byStoreRevenue[r.store_type] || 0) + r.total_revenue_inr;
      byBrand[r.brand] = (byBrand[r.brand] || 0) + r.total_revenue_inr;
      byPayment[r.payment_mode] = (byPayment[r.payment_mode] || 0) + 1;

      if (r.temperature_celsius >= 32) {
        hotRevenue += r.total_revenue_inr;
        hotCount += 1;
      } else {
        coolRevenue += r.total_revenue_inr;
        coolCount += 1;
      }
    });

    const topOccasion = Object.entries(byOccasion).sort((a, b) => b[1] - a[1])[0];
    const topSegment = Object.entries(bySegmentRevenue).sort((a, b) => b[1] - a[1])[0];
    const lowSegment = Object.entries(bySegmentRevenue).sort((a, b) => a[1] - b[1])[0];
    const topStore = Object.entries(byStoreRevenue).sort((a, b) => b[1] - a[1])[0];
    const topBrand = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0];
    const topPay = Object.entries(byPayment).sort((a, b) => b[1] - a[1])[0];
    const topPayShare = topPay ? (topPay[1] * 100) / filtered.length : 0;

    const hotAvg = hotCount ? hotRevenue / hotCount : 0;
    const coolAvg = coolCount ? coolRevenue / coolCount : 0;
    const heatImpact = coolAvg ? ((hotAvg - coolAvg) * 100) / coolAvg : 0;

    return [
      {
        title: "Scale Winning Occasion",
        icon: CalendarDays,
        metric: topOccasion ? `${topOccasion[0]} · ${inr(topOccasion[1])}` : "Insufficient data",
        action: topOccasion
          ? `Create store-level bundles around ${topOccasion[0]} with ${growth.bestBin?.key || "6-10"}% offers in ${topStore?.[0] || "top stores"}.`
          : "Add more filtered data to generate this recommendation.",
      },
      {
        title: "Fix Revenue Gap Segments",
        icon: Megaphone,
        metric: lowSegment ? `${lowSegment[0]} trails ${topSegment?.[0] || "leaders"}` : "Insufficient data",
        action: lowSegment
          ? `Target ${lowSegment[0]} with campaigns built around ${growth.lowSegments?.[0]?.topOccasion || "Regular Purchase"} and elevate satisfaction with combo pricing.`
          : "Add more filtered data to generate this recommendation.",
      },
      {
        title: "Conversion & Weather Strategy",
        icon: Lightbulb,
        metric: `${topPay?.[0] || "UPI"} share ${topPayShare.toFixed(1)}% · Heat impact ${heatImpact.toFixed(1)}%`,
        action:
          heatImpact < 0
            ? `Sales soften in hotter conditions. Push chilled upsell formats in afternoons and promote ${topBrand?.[0] || "top brands"} via ${topPay?.[0] || "UPI"} cashback.`
            : `Hot days convert better. Increase inventory of ${topBrand?.[0] || "top brands"} and run peak-hour promotions via ${topPay?.[0] || "UPI"}.`,
      },
    ];
  }, [filtered, growth]);

  const localityRows = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      map[r.locality] ??= { locality: r.locality, totalRevenue: 0, units: 0, sat: 0, count: 0, brands: {} };
      const m = map[r.locality];
      m.totalRevenue += r.total_revenue_inr;
      m.units += r.quantity_sold;
      m.sat += r.customer_satisfaction;
      m.count += 1;
      m.brands[r.brand] = (m.brands[r.brand] || 0) + r.total_revenue_inr;
    });
    const table = Object.values(map).map((l) => ({
      locality: l.locality,
      totalRevenue: l.totalRevenue,
      units: l.units,
      avgSat: l.count ? l.sat / l.count : 0,
      topBrand: Object.entries(l.brands).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
    }));
    return table.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === "string" || typeof bv === "string") {
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortBy, sortDir]);

  const displayRevenue = useCountUp(kpis.totalRevenue);
  const displayUnits = useCountUp(kpis.units);
  const displaySat = useCountUp(kpis.avgSat);
  const displayDisc = useCountUp(kpis.avgDisc);

  const setFilter = (k, v) => setFilters((s) => ({ ...s, [k]: v }));
  const resetFilters = () => setFilters({ month: "", storeType: "", brand: "", segment: "" });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a0a00] text-amber-200">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-700 border-t-amber-300" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{
        fontFamily: "DM Sans, sans-serif",
        background: "radial-gradient(circle at top, #2d1500 0%, #1a0a00 45%)",
        color: "var(--text-primary)",
        "--bg-primary": "#1a0a00",
        "--bg-card": "#2d1500",
        "--accent-gold": "#d4870a",
        "--accent-amber": "#f59e0b",
        "--text-primary": "#fef3c7",
        "--text-muted": "#a78060",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <GlassCard className="p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-amber-200 md:text-4xl" style={{ fontFamily: "Playfair Display, serif" }}>
                🍫 Ballari Chocolate Sales Intelligence
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)] md:text-base">2024 · Ballari, Karnataka</p>
            </div>
            <div className="rounded-xl border border-amber-800/50 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Live Total Revenue</p>
              <p className="text-2xl font-semibold text-amber-300">{inr(displayRevenue)}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { key: "month", label: "Month", value: filters.month, opts: options.months },
              { key: "storeType", label: "Store Type", value: filters.storeType, opts: options.storeTypes },
              { key: "brand", label: "Brand", value: filters.brand, opts: options.brands },
              { key: "segment", label: "Customer Segment", value: filters.segment, opts: options.segments },
            ].map((f) => (
              <select
                key={f.key}
                className="w-full rounded-lg border border-amber-800/50 bg-[#1a0a00] px-3 py-2 text-sm text-amber-100 outline-none transition hover:border-amber-600"
                value={f.value}
                onChange={(e) => setFilter(f.key, e.target.value)}
              >
                <option value="">All {f.label}</option>
                {f.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-2 text-sm transition hover:bg-amber-800/40"
              onClick={resetFilters}
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Revenue", val: inr(displayRevenue), icon: IndianRupee },
            { label: "Total Units Sold", val: formatterINR.format(displayUnits), icon: Package },
            { label: "Avg Customer Satisfaction", val: `${displaySat.toFixed(2)}/5 ⭐`, icon: Sparkles },
            { label: "Avg Discount Given", val: `${displayDisc.toFixed(1)}%`, icon: Tag },
          ].map((kpi) => (
            <GlassCard key={kpi.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{kpi.label}</p>
                  <p className="mt-1 text-xl font-semibold text-amber-200">{kpi.val}</p>
                </div>
                <kpi.icon className="text-amber-500" size={20} />
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <GlassCard className="h-[360px]">
            <h3 className="mb-2 text-lg font-semibold text-amber-200">Monthly Revenue Trend</h3>
            <ResponsiveContainer>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4870a" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#d4870a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#6b3f1f33" />
                <XAxis dataKey="month" stroke="#a78060" />
                <YAxis stroke="#a78060" tickFormatter={(v) => compactRupee(v)} />
                <Tooltip content={<TooltipBox />} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revArea)" strokeWidth={2} />
                {monthlyTrend
                  .filter((m) => m.festival)
                  .map((m) => (
                    <ReferenceDot key={m.month} x={m.month} y={m.revenue} r={6} fill="#ff9f1c" stroke="#fef3c7" label="Festival Boost" />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="h-[360px]">
            <h3 className="mb-2 text-lg font-semibold text-amber-200">Brand Performance</h3>
            <ResponsiveContainer>
              <BarChart data={brandData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#6b3f1f33" />
                <XAxis type="number" stroke="#a78060" tickFormatter={(v) => compactRupee(v)} />
                <YAxis type="category" dataKey="brand" stroke="#a78060" width={80} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-amber-700/50 bg-[#1c0d02]/95 p-3 text-xs text-amber-100">
                        <p className="mb-1 font-semibold text-amber-300">{label}</p>
                        <p>Revenue: {inr(payload[0]?.payload?.revenue)}</p>
                        <p>Quantity: {formatterINR.format(payload[0]?.payload?.qty)}</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                  {brandData.map((_, i) => (
                    <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <GlassCard className="h-[360px]">
            <h3 className="mb-2 text-lg font-semibold text-amber-200">Store Type Revenue Share</h3>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={storeShare} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60} paddingAngle={2}>
                  {storeShare.map((_, i) => (
                    <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-amber-700/50 bg-[#1c0d02]/95 p-3 text-xs text-amber-100">
                        <p className="font-semibold text-amber-300">{payload[0].name}</p>
                        <p>{inr(payload[0].value)} ({payload[0].payload.pct.toFixed(1)}%)</p>
                      </div>
                    ) : null
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="h-[360px]">
            <h3 className="mb-2 text-lg font-semibold text-amber-200">Customer Segment Breakdown</h3>
            <ResponsiveContainer>
              <BarChart data={segmentOccasion}>
                <CartesianGrid stroke="#6b3f1f33" />
                <XAxis dataKey="customer_segment" stroke="#a78060" interval={0} angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#a78060" tickFormatter={(v) => compactRupee(v)} />
                <Tooltip content={<TooltipBox />} />
                <Legend />
                {occasions.map((o, idx) => (
                  <Bar key={o} dataKey={o} stackId="a" fill={OCCASION_COLORS[idx % OCCASION_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <GlassCard className="h-[420px]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-amber-200">Does Heat Affect Sales?</h3>
            <p className="text-sm text-[var(--text-muted)]">Trend line estimates temperature impact on transaction revenue</p>
          </div>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="#6b3f1f33" />
              <XAxis dataKey="temperature" type="number" unit="°C" stroke="#a78060" domain={[20, 40]} />
              <YAxis dataKey="revenue" type="number" stroke="#a78060" tickFormatter={(v) => compactRupee(v)} />
              <Tooltip content={<TooltipBox />} />
              <Legend />
              {Object.entries(scatterByType).map(([type, data]) => (
                <Scatter key={type} name={type} data={data} fill={TYPE_COLORS[type] || "#f59e0b"} />
              ))}
              {trendLine.length === 2 && <Line type="linear" data={trendLine} dataKey="revenue" stroke="#fef3c7" dot={false} legendType="none" />}
            </ScatterChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="mb-3 text-lg font-semibold text-amber-200">Insights</h3>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <p>🏆 Top Brand: <b>{insights.topBrand?.brand || "-"}</b> with {inr(insights.topBrand?.revenue || 0)} revenue</p>
            <p>📅 Best Month: <b>{insights.bestMonth?.month || "-"}</b></p>
            <p>🏪 Best Store Type: <b>{insights.bestStore?.name || "-"}</b></p>
            <p>💳 Preferred Payment: <b>{insights.topPay?.[0] || "-"}</b> ({insights.payPct.toFixed(1)}% of transactions)</p>
            <p>🎉 Festival Uplift: Sales are <b>{insights.uplift.toFixed(1)}%</b> higher in festival months</p>
            <p>⭐ Satisfaction Leader: <b>{insights.satLeader?.store || "-"}</b> scores {insights.satLeader?.score?.toFixed(2) || "0.00"}/5</p>
          </div>
        </GlassCard>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-amber-200">💡 Growth Opportunities</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <GlassCard>
              <p className="mb-2 text-sm font-semibold text-amber-300">LOW DISCOUNT SWEET SPOT</p>
              <p className="mb-2 text-xs text-[var(--text-muted)]">Best-performing discount band: <b>{growth.bestBin?.key}</b></p>
              <div className="h-28">
                <ResponsiveContainer>
                  <BarChart data={growth.bins}>
                    <XAxis dataKey="key" stroke="#a78060" />
                    <YAxis hide />
                    <Tooltip content={<TooltipBox />} />
                    <Bar dataKey="revenue" fill="#d4870a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
            <GlassCard>
              <p className="mb-2 text-sm font-semibold text-amber-300">WEEKEND VS WEEKDAY</p>
              <p className="text-sm">Weekend: {inr(growth.weekend)}</p>
              <p className="text-sm">Weekday: {inr(growth.weekday)}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Recommendation: {growth.weekend > growth.weekday ? "Push premium bundles and gifting offers over weekends." : "Strengthen weekday office-treat combos and afternoon offers."}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="mb-2 text-sm font-semibold text-amber-300">UNDERPERFORMING SEGMENTS</p>
              {growth.lowSegments.length ? (
                growth.lowSegments.map((s) => (
                  <p key={s.segment} className="mb-2 text-sm">
                    {s.segment}: {s.sat.toFixed(2)}/5 - Target <b>{s.topOccasion}</b> campaigns
                  </p>
                ))
              ) : (
                <p className="text-sm">Not enough data.</p>
              )}
            </GlassCard>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-amber-200">🚀 Sales Improvement Playbook</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {salesPlaybook.map((item) => (
              <GlassCard key={item.title} className="border-amber-700/60">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <item.icon size={16} />
                  <p className="text-sm font-semibold">{item.title}</p>
                </div>
                <p className="text-sm text-amber-100">{item.metric}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{item.action}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-200">Top Localities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-amber-900/50 text-[var(--text-muted)]">
                <tr>
                  {[
                    ["locality", "Locality"],
                    ["totalRevenue", "Total Revenue"],
                    ["units", "Units Sold"],
                    ["avgSat", "Avg Satisfaction"],
                    ["topBrand", "Top Brand"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className="cursor-pointer px-3 py-2"
                      onClick={() => {
                        if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setSortBy(key);
                          setSortDir("desc");
                        }
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localityRows.map((r, idx) => (
                  <tr key={r.locality} className={`border-b border-amber-950/40 ${idx < 3 ? "bg-amber-900/20" : ""}`}>
                    <td className="px-3 py-2">{r.locality}</td>
                    <td className="px-3 py-2">{inr(r.totalRevenue)}</td>
                    <td className="px-3 py-2">{formatterINR.format(r.units)}</td>
                    <td className="px-3 py-2">{r.avgSat.toFixed(2)}</td>
                    <td className="px-3 py-2">{r.topBrand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="pb-3 text-center text-xs text-[var(--text-muted)]">
          <TrendingUp className="mr-1 inline" size={14} /> Premium analytics for chocolate growth in Ballari
          <Trophy className="mx-2 inline" size={14} />
          <Store className="mr-1 inline" size={14} />
          <CreditCard className="mr-1 inline" size={14} />
        </div>
      </div>
    </div>
  );
}

export default App;
