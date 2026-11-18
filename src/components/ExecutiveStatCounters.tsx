import React from 'react';
import {
  Building2,
  Boxes,
  Layers,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ExecutiveStatCountersProps {
  totalFacilitiesCount?: number;
  totalAssetsCount?: number;
  activeSectorsCount?: number;
  invariantSafetyScore?: number;
  onExploreFacilities?: () => void;
  onExploreAssets?: () => void;
  onExploreSectors?: () => void;
  onExploreSafety?: () => void;
}

export default function ExecutiveStatCounters({
  totalFacilitiesCount = 14,
  totalAssetsCount = 1280,
  activeSectorsCount = 8,
  invariantSafetyScore = 100,
  onExploreFacilities,
  onExploreAssets,
  onExploreSectors,
  onExploreSafety,
}: ExecutiveStatCountersProps) {
  const stats = [
    {
      id: 'facilities',
      label: 'FACILITIES',
      value: totalFacilitiesCount,
      sublabel: 'Connected Care Hubs',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      accentColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
      buttonText: 'EXPLORE FACILITIES',
      onClick: onExploreFacilities,
    },
    {
      id: 'assets',
      label: 'TRACKED ASSETS',
      value: totalAssetsCount.toLocaleString(),
      sublabel: 'Ventilators, Ambulances & O2',
      glowColor: 'rgba(20, 184, 166, 0.25)',
      accentColor: 'text-teal-600',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: <Boxes className="w-5 h-5 text-teal-600" />,
      buttonText: 'INSPECT INVENTORY',
      onClick: onExploreAssets,
    },
    {
      id: 'sectors',
      label: 'SECTORS',
      value: activeSectorsCount,
      sublabel: 'Critical Care Domains',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      accentColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      buttonText: 'VIEW DOMAINS',
      onClick: onExploreSectors,
    },
    {
      id: 'safety',
      label: 'INVARIANT SAFETY',
      value: `${invariantSafetyScore}%`,
      sublabel: 'Baseline Protection Formula',
      glowColor: 'rgba(225, 29, 72, 0.25)',
      accentColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      buttonText: 'AUDIT INVARIANT',
      onClick: onExploreSafety,
    },
  ];

  return (
    <section aria-label="Executive Key Stats" className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-heading">
            Network Operations Summary
          </h2>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          Real-Time Aggregation across Regional Operations Network
        </span>
      </div>

      {/* 4 Floaty Elevated White Cards matching ICCC Video Frame 00:07 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <div key={stat.id} className="relative group">
            {/* Floaty Ambient Colored Glow beneath the card on cursor hover */}
            <div
              className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 pointer-events-none"
              style={{ backgroundColor: stat.glowColor }}
            />

            {/* Floaty Motion Card with Spring Physics */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                y: -10,
                scale: 1.025,
                transition: { type: 'spring', stiffness: 350, damping: 22 },
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="relative iccc-stat-box flex flex-col justify-between group shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200/90 rounded-2xl bg-white"
              onClick={stat.onClick}
            >
              {/* Top Card Area: Crisp White Editorial Card */}
              <div className="p-6 sm:p-7 flex flex-col items-center text-center relative z-10">
                {/* Sleek Minimalist Badge with refined icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 ${stat.badgeBg}`}
                >
                  {stat.icon}
                </div>

                {/* Prominent High-Contrast Numerals */}
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading group-hover:text-slate-950 transition-colors">
                  {stat.value}
                </div>

                {/* Crisp Bold Label */}
                <div className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider uppercase mt-2.5 font-heading">
                  {stat.label}
                </div>

                {/* Context Subtitle */}
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  {stat.sublabel}
                </p>
              </div>

              {/* Bottom Solid Dark Slate Action Bar with forward-sliding arrow */}
              <div className="w-full bg-[#0F172A] group-hover:bg-[#1E293B] py-3.5 px-4 flex items-center justify-center gap-2.5 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 relative z-10 border-t border-slate-100">
                <span>{stat.buttonText}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
