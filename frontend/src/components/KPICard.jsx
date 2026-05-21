import React from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Activity } from 'lucide-react';

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', className = '' }) => {
  const colorMap = {
    blue: 'from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    green: 'from-green-50 to-green-100 text-green-600 border-green-200',
    red: 'from-red-50 to-red-100 text-red-600 border-red-200',
    purple: 'from-purple-50 to-purple-100 text-purple-600 border-purple-200',
    amber: 'from-amber-50 to-amber-100 text-amber-600 border-amber-200',
  };

  const bgClass = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${bgClass} flex-shrink-0`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <>
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-green-600 font-medium">{trend}% este mês</span>
            </>
          ) : (
            <>
              <TrendingDown size={16} className="text-red-600" />
              <span className="text-red-600 font-medium">{Math.abs(trend)}% este mês</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
