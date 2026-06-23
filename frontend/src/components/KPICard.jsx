import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue:   { bg: 'rgba(59,111,245,0.1)',   color: '#3b6ff5',  shadow: 'rgba(59,111,245,0.2)' },
  green:  { bg: 'rgba(16,185,129,0.1)',   color: '#10b981',  shadow: 'rgba(16,185,129,0.2)' },
  red:    { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444',  shadow: 'rgba(239,68,68,0.2)' },
  purple: { bg: 'rgba(168,85,247,0.1)',   color: '#a855f7',  shadow: 'rgba(168,85,247,0.2)' },
  amber:  { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b',  shadow: 'rgba(245,158,11,0.2)' },
};

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', className = '', delay = 0 }) => {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`card ${className}`}
      style={{
        animation: 'fadeUp 0.4s ease-out forwards',
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-3)' }}
          >
            {title}
          </p>
          <h3 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-1)' }}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{
            background: c.bg,
            color: c.color,
            boxShadow: `0 4px 12px ${c.shadow}`,
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {Icon && <Icon size={22} />}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
          {trend > 0 ? (
            <>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
              >
                <TrendingUp size={12} />
                +{trend}%
              </span>
              <span style={{ color: 'var(--text-3)' }}>este mês</span>
            </>
          ) : (
            <>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                <TrendingDown size={12} />
                {trend}%
              </span>
              <span style={{ color: 'var(--text-3)' }}>este mês</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
