import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { getMenuTheme } from '../../utils/menuThemes';
import { ChevronRight, Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  stats?: Array<{ label: string; value: string | number; helper?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  stats
}) => {
  const { activeMenu, currentUser } = useApp();
  const theme = getMenuTheme(activeMenu);
  const Icon = theme.icon;

  const displayTitle = title || theme.label;
  const displaySubtitle = subtitle || theme.desc;
  const displayBadge = badge || theme.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs overflow-hidden relative"
    >
      {/* Top subtle decorative color banner */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />

      {/* Ambient background glow matching menu's personality */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: theme.primaryHex }}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
        {/* Left side: Icon, Breadcrumb, Title & Subtitle */}
        <div className="flex items-start gap-3.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-md shadow-slate-200 transition`}
          >
            <Icon className="h-6 w-6" />
          </motion.div>

          <div>
            {/* Breadcrumb & Category Badge */}
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-slate-500">
              <span>{currentUser?.role === 'admin' ? 'Administrator' : 'Guru'}</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.primaryHex }} />
                {displayBadge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{displayTitle}</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="mt-0.5 text-xs text-slate-500 max-w-2xl leading-relaxed">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Right side: Actions / Controls */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 self-start md:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Optional Stats mini-strip with colorful cards */}
      {stats && stats.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, idx) => {
            const cardPalettes = [
              {
                bg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/70',
                border: 'border-emerald-200/80 hover:border-emerald-300',
                label: 'text-emerald-700',
                value: 'text-emerald-900',
                accentDot: 'bg-emerald-500',
                helper: 'text-emerald-700/70'
              },
              {
                bg: 'bg-gradient-to-br from-sky-50 via-white to-blue-50/70',
                border: 'border-sky-200/80 hover:border-sky-300',
                label: 'text-sky-700',
                value: 'text-sky-900',
                accentDot: 'bg-sky-500',
                helper: 'text-sky-700/70'
              },
              {
                bg: 'bg-gradient-to-br from-purple-50 via-white to-fuchsia-50/70',
                border: 'border-purple-200/80 hover:border-purple-300',
                label: 'text-purple-700',
                value: 'text-purple-900',
                accentDot: 'bg-purple-500',
                helper: 'text-purple-700/70'
              },
              {
                bg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50/70',
                border: 'border-amber-200/80 hover:border-amber-300',
                label: 'text-amber-700',
                value: 'text-amber-900',
                accentDot: 'bg-amber-500',
                helper: 'text-amber-700/70'
              }
            ];
            const palette = cardPalettes[idx % cardPalettes.length];

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`rounded-2xl p-3 border ${palette.bg} ${palette.border} shadow-xs relative overflow-hidden transition-all`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${palette.accentDot}`} />
                  <span className={`text-[11px] font-bold ${palette.label} block truncate uppercase tracking-wider`}>
                    {stat.label}
                  </span>
                </div>
                <span className={`text-base sm:text-lg font-black ${palette.value} block`}>
                  {stat.value}
                </span>
                {stat.helper && (
                  <span className={`text-[10px] ${palette.helper} block mt-0.5 font-medium truncate`}>
                    {stat.helper}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
