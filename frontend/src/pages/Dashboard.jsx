import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users, CreditCard, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, DollarSign, Activity,
  PieChart as PieChartIcon, Heart, UserPlus, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const formatXOF = (val) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(Number(val || 0));

/* KPI Card */
const KpiCard = ({ label, value, unit, sub, subColor = '#10b981', icon: Icon, iconBg, iconColor, accent }) => (
  <div
    className="card overflow-hidden relative"
    style={accent ? { background: accent, border: 'none' } : {}}
  >
    {accent && <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent)' }} />}
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest"
           style={{ color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>
          {label}
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <h3 className="text-2xl font-extrabold leading-none"
              style={{ color: accent ? '#fff' : 'var(--text-1)' }}>
            {value}
          </h3>
          {unit && (
            <span className="text-sm font-medium"
                  style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}>
              {unit}
            </span>
          )}
        </div>
        {sub && (
          <p className="text-xs font-semibold mt-3 flex items-center gap-1"
             style={{ color: accent ? 'rgba(255,255,255,0.75)' : subColor }}>
            {sub}
          </p>
        )}
      </div>
      <div className="p-3 rounded-xl flex-shrink-0"
           style={{ background: accent ? 'rgba(255,255,255,0.15)' : iconBg, color: accent ? '#fff' : iconColor }}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/resumo')
      .then(res => setData(res.data.data))
      .catch(err => console.error('Erro ao carregar dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <TrendingDown size={40} style={{ color: 'var(--text-3)' }} />
      <p style={{ color: 'var(--text-2)' }}>Erro ao carregar dados do dashboard.</p>
    </div>
  );

  const { membros, quotas, financeiro, fluxo_mensal } = data;
  const saldoMes = Number(financeiro?.receitas_mes || 0) - Number(financeiro?.despesas_mes || 0);

  const formattedFluxo = (fluxo_mensal || []).map(item => ({
    ...item,
    receitas: Number(item.receitas || 0),
    despesas: Number(item.despesas || 0),
  }));

  const membrosDistrib = [
    { name: 'Ativos',    value: Number(membros?.ativos || 0),    color: '#10b981' },
    { name: 'Suspensos', value: Number(membros?.suspensos || 0),  color: '#ef4444' },
    { name: 'Reformados',value: Number(membros?.reformados || 0), color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    boxShadow: 'var(--shadow-lg)',
    fontSize: '13px',
    fontWeight: 600,
  };

  return (
    <div className="fade-in space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Dashboard Executivo
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Visão geral em tempo real — SF-DGCI
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
             style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <Calendar size={15} />
          {new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total de Membros"
          value={membros?.total ?? 0}
          sub={<><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#10b981' }} /> {membros?.ativos} ativos</>}
          icon={Users}
          iconBg="rgba(59,111,245,0.1)"
          iconColor="#3b6ff5"
        />
        <KpiCard
          label="Quotas Cobradas"
          value={formatXOF(quotas?.total_quotas_cobradas)}
          unit="XOF"
          sub={<><TrendingDown size={13} style={{ display: 'inline' }} /> Dívida: {formatXOF(quotas?.total_quota_divida_ano)} XOF</>}
          subColor="#ef4444"
          icon={CreditCard}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
        />
        <KpiCard
          label="Fundo Social"
          value={formatXOF(quotas?.total_fundo_social_cobrado)}
          unit="XOF"
          sub={<><TrendingDown size={13} style={{ display: 'inline' }} /> Dívida: {formatXOF(quotas?.total_fundo_social_divida_ano)} XOF</>}
          subColor="#ef4444"
          icon={Heart}
          iconBg="rgba(168,85,247,0.1)"
          iconColor="#a855f7"
        />
        <KpiCard
          label="Dívida Total"
          value={formatXOF(quotas?.total_divida_ano)}
          unit="XOF"
          sub={<><ArrowDownRight size={13} style={{ display: 'inline' }} /> {quotas?.pendentes} pendentes</>}
          subColor="#ef4444"
          icon={TrendingDown}
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#ef4444"
        />
        <KpiCard
          label="Saldo do Mês"
          value={formatXOF(saldoMes)}
          unit="XOF"
          sub={
            <>
              <ArrowUpRight size={12} style={{ display: 'inline' }} />
              {formatXOF(financeiro?.receitas_mes)}{' '}
              <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 3px' }}>|</span>
              <ArrowDownRight size={12} style={{ display: 'inline' }} />
              {formatXOF(financeiro?.despesas_mes)}
            </>
          }
          icon={DollarSign}
          accent="linear-gradient(135deg, #3b6ff5, #2e5de0)"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area / Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Fluxo Financeiro Mensal
            </h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
              {new Date().getFullYear()}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={formattedFluxo} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="mes"
                tickFormatter={(v) => MESES[(v - 1)] || v}
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              />
              <RechartsTooltip
                formatter={(v) => `${formatXOF(v)} XOF`}
                labelFormatter={(v) => `Mês: ${MESES[(v - 1)] || v}`}
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--surface-hover)', radius: 4 }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 16, fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }} />
              <Bar name="Receitas" dataKey="receitas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar name="Despesas" dataKey="despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — member distribution */}
        <div className="card">
          <h3 className="font-bold text-base flex items-center gap-2 mb-5" style={{ color: 'var(--text-1)' }}>
            <PieChartIcon size={18} style={{ color: '#f59e0b' }} />
            Distribuição de Membros
          </h3>

          {membrosDistrib.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={membrosDistrib}
                    cx="50%" cy="50%"
                    innerRadius={58} outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {membrosDistrib.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v) => [`${v} membros`, 'Quantidade']}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 space-y-2">
                {membrosDistrib.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--text-1)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p style={{ color: 'var(--text-3)' }}>Sem dados disponíveis</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
