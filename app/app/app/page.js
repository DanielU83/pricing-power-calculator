"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
  ReferenceLine
} from "recharts";

// Helper functions
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

export default function App() {
  const [company, setCompany] = useState("Acme Inc");
  const [year, setYear] = useState(2025);
  const [cogsPct, setCogsPct] = useState(45); // as percent of Sales
  const [fixedPct, setFixedPct] = useState(30); // as percent of Sales

  // Trade-off inputs
  const [priceChangeTradeoffPct, setPriceChangeTradeoffPct] = useState(-5); // -5% default

  const salesPct = 100; // normalized

  const structure = useMemo(() => {
    const c = cogsPct / 100;
    const f = fixedPct / 100;
    const margin = 1 - c - f;

    return {
      c,
      f,
      margin,
      isValid: margin > 0, // strict inequality for division safety
    };
  }, [cogsPct, fixedPct]);

  const onePercentImpacts = useMemo(() => {
    const { c, f, margin, isValid } = structure;
    // We handle the margin <= 0 case specifically to avoid Infinity
    if (margin <= 0) {
      return {
        price: NaN,
        volume: NaN,
        fixed: NaN,
        cogs: NaN,
      };
    }

    // 1% improvement levers:
    // Price +1% -> profit change = 0.01 / margin
    const price = 0.01 / margin;

    // Volume +1%, Variable costs fully variable -> profit change = 0.01 * (1 - c) / margin
    const volume = (0.01 * (1 - c)) / margin;

    // Fixed costs -1% -> profit change = 0.01 * f / margin
    const fixed = (0.01 * f) / margin;

    // Variable costs -1% -> profit change = 0.01 * c / margin
    const cogs = (0.01 * c) / margin;

    return { price, volume, fixed, cogs };
  }, [structure]);

  const priceIncreaseProfitEffect = onePercentImpacts.price; 

  const tradeoff = useMemo(() => {
    const { c, isValid } = structure;
    if (!isValid) return { volumeRequired: NaN };

    const p = priceChangeTradeoffPct / 100; 

    // Profit-preserving volume change for a given price change p, with variable costs c:
    // (1+v)(1 + p - c) = 1 - c  =>  v = (1 - c)/(1 + p - c) - 1
    const denominator = 1 + p - c;
    
    // Guard against division by zero or negative denominator implies impossible break-even
    if (denominator <= 0) return { volumeRequired: NaN };

    const volumeRequired = (1 - c) / denominator - 1;

    return { volumeRequired };
  }, [structure, priceChangeTradeoffPct]);

  // Colors updated to be softer (Tailwind 400 series)
  const colors = {
    blue: "#60a5fa",
    red: "#f87171",
    orange: "#fb923c",
    green: "#4ade80",
    purple: "#a78bfa",
    slate: "#cbd5e1"
  };

  const structureData = [
    { name: "Sales", value: salesPct, fill: colors.blue },
    { name: "Variable Costs", value: cogsPct, fill: colors.red },
    { name: "Fixed Costs", value: fixedPct, fill: colors.orange },
    { name: "Profit", value: Math.max(0, (1 - cogsPct/100 - fixedPct/100) * 100), fill: structure.isValid ? colors.green : colors.slate },
  ];

  // Reordered: Price, Volume, Variable Costs, Fixed Costs
  const improvementData = [
    { lever: "Price", improvement: onePercentImpacts.price, fill: colors.blue },
    { lever: "Volume", improvement: onePercentImpacts.volume, fill: colors.purple },
    { lever: "Variable Costs", improvement: onePercentImpacts.cogs, fill: colors.red },
    { lever: "Fixed Costs", improvement: onePercentImpacts.fixed, fill: colors.orange },
  ];

  const tradeoffData = [
    { label: "Price Change", value: priceChangeTradeoffPct / 100, fill: colors.blue },
    { label: "Required Volume", value: tradeoff.volumeRequired, fill: colors.purple },
  ];

  const marginDisplay = structure.margin * 100;
  const invalid = structure.margin <= 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-8 px-4 font-sans">
      <div className="w-full max-w-6xl space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pricing Power Calculator</h1>
            <p className="mt-1 text-sm text-slate-500">
              Analyze operating leverage and price/volume trade-offs.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col text-sm">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company</label>
              <input
                className="w-32 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="flex flex-col text-sm">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Year</label>
              <input
                type="number"
                className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={year}
                onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
        </header>

        {/* FINANCIAL INPUTS */}
        <section className="grid gap-6 md:grid-cols-3 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          
          {/* COL 1: Structure Inputs */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              1. Financial Structure
            </h2>
            <div className="grid grid-cols-[1fr_auto_auto] gap-y-3 gap-x-3 items-center text-sm">
              <span className="text-slate-600 font-medium">Sales</span>
              <span className="justify-self-end font-mono font-bold text-slate-900">{salesPct.toFixed(1)}</span>
              <span className="text-xs text-slate-400 w-8">%</span>

              <span className="text-slate-600 font-medium">Variable Costs</span>
              <input
                type="number"
                step="1"
                min={0}
                max={99}
                className="justify-self-end w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                value={cogsPct}
                onChange={(e) => setCogsPct(clamp(Number(e.target.value || 0), 0, 100))}
              />
              <span className="text-xs text-slate-400 w-8">%</span>

              <span className="text-slate-600 font-medium">Fixed Costs</span>
              <input
                type="number"
                step="1"
                min={0}
                max={99}
                className="justify-self-end w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                value={fixedPct}
                onChange={(e) => setFixedPct(clamp(Number(e.target.value || 0), 0, 100))}
              />
              <span className="text-xs text-slate-400 w-8">%</span>

              <div className="col-span-3 h-px bg-slate-100 my-1"></div>

              <span className="text-slate-800 font-bold">Operating Profit</span>
              <span className={`justify-self-end font-mono font-bold ${invalid ? 'text-red-500' : 'text-green-600'}`}>
                {marginDisplay.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 w-8">%</span>
            </div>
            
            {invalid && (
              <div className="text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100 mt-2">
                Warning: Costs exceed Sales.
              </div>
            )}
          </div>

          {/* COL 2: Leverage Metric */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">
                2. Power of 1%
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                If you raise price by <span className="font-bold text-blue-600 bg-blue-50 px-1 rounded">1%</span> (holding volume constant), your operating profit grows by:
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">
                  {invalid ? "-" : formatPercent(priceIncreaseProfitEffect, 1)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                 Formula: <span className="font-mono bg-slate-100 px-1 rounded">1% ÷ Op. Margin</span>
              </p>
            </div>
          </div>

          {/* COL 3: Trade-off Calculator */}
          <div className="flex flex-col">
            <h2 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              3. Break-Even Analysis
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  If Price Changes By...
                </label>
                <div className="flex items-center gap-3">
                   <input
                    type="range"
                    min={-20}
                    max={20}
                    step={0.5}
                    value={priceChangeTradeoffPct}
                    onChange={(e) => setPriceChangeTradeoffPct(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="relative w-20">
                    <input
                      type="number"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-right font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={priceChangeTradeoffPct}
                      onChange={(e) => setPriceChangeTradeoffPct(clamp(Number(e.target.value || 0), -50, 50))}
                    />
                    <span className="absolute right-6 top-1.5 text-xs text-slate-400 pointer-events-none"></span>
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Required Volume Change</p>
                <p className={`text-2xl font-bold ${tradeoff.volumeRequired > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                   {invalid || !Number.isFinite(tradeoff.volumeRequired) ? "-" : (tradeoff.volumeRequired > 0 ? "+" : "") + formatPercent(tradeoff.volumeRequired, 1)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Volume needed to maintain current profit amount.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHARTS ROW */}
        <section className="grid gap-6 md:grid-cols-3">
          
          {/* Chart 1: Structure */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col h-[320px]">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Cost Structure</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={structureData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(val) => `${val.toFixed(1)}%`}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {structureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="top" formatter={(v) => `${v.toFixed(0)}`} style={{fill: '#64748b', fontSize: 11, fontWeight: 600}} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Sensitivity */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col h-[320px]">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Impact of 1% Improvement</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={improvementData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="lever" tick={{fontSize: 11, fill: '#64748b'}} width={80} tickLine={false} axisLine={false} />
                  <Tooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                     formatter={(val) => `+${(val*100).toFixed(1)}% Profit`}
                  />
                  <Bar dataKey="improvement" radius={[0, 4, 4, 0]} barSize={30}>
                    {improvementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="improvement" position="right" formatter={(v) => `+${(v*100).toFixed(1)}%`} style={{fill: '#475569', fontSize: 11, fontWeight: 600}} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Trade-off */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col h-[320px]">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Trade-off Visualization</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeoffData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(val) => `${(val*100).toFixed(1)}%`}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                     {tradeoffData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value < 0 ? colors.red : entry.fill} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      formatter={(v) => `${(v*100).toFixed(1)}%`} 
                      style={{fill: '#475569', fontSize: 11, fontWeight: 600}} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
