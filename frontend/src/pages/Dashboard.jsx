import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Users, CreditCard, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, DollarSign, Activity,
  PieChart as PieChartIcon, Heart, Calendar, Inbox,
  AlertCircle, ChevronRight, Clock, MessageSquare
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const formatXOF = (val) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(Number(val || 0));

/* ── Skeleton Card ── */
const SkeletonCard = ({ delay = 0 }) => (
  <div
    className="card overflow-hidden"
    style={{ animationDelay: `${delay}ms`, animation: 'fadeUp 0.4s ease-out forwards', opacity: 0 }}
  >
    <div className="flex justify-between items-start">
      <div className="flex-1 space-y-3">
        <div className="skeleton h-2.5 w-20 rounded" />
        <div className="skeleton h-7 w-28 rounded" />
        <div className="skeleton h-2 w-24 rounded" />
      </div>
      <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
    </div>
  </div>
);

/* ── KPI Card ── */
const KpiCard = ({ label, value, unit, sub, subColor = '#10b981', icon: Icon, iconBg, iconColor, accent, delay = 0 }) => (
  <div
    className="card overflow-hidden relative"
    style={{
      ...(accent ? { background: accent, border: 'none' } : {}),
      animation: 'fadeUp 0.45s ease-out forwards',
      animationDelay: `${delay}ms`,
      opacity: 0,
    }}
  >
    {accent && (
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent)' }}
      />
    )}
    {/* Shine overlay */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: accent ? 'rgba(255,255,255,0.25)' : 'transparent' }}
    />

    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}
        >
          {label}
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <h3
            className="text-2xl font-extrabold leading-none"
            style={{ color: accent ? '#fff' : 'var(--text-1)' }}
          >
            {value}
          </h3>
          {unit && (
            <span
              className="text-sm font-medium"
              style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}
            >
              {unit}
            </span>
          )}
        </div>
        {sub && (
          <p
            className="text-xs font-semibold mt-3 flex items-center gap-1"
            style={{ color: accent ? 'rgba(255,255,255,0.75)' : subColor }}
          >
            {sub}
          </p>
        )}
      </div>
      <div
        className="p-3 rounded-xl flex-shrink-0"
        style={{
          background: accent ? 'rgba(255,255,255,0.15)' : iconBg,
          color: accent ? '#fff' : iconColor,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <Icon size={22} />
      </div>
    </div>
  </div>
);

/* ── Skeleton Chart ── */
const SkeletonChart = ({ height = 280, delay = 0 }) => (
  <div
    className="card"
    style={{ animation: 'fadeUp 0.4s ease-out forwards', animationDelay: `${delay}ms`, opacity: 0 }}
  >
    <div className="flex items-center justify-between mb-5">
      <div className="skeleton h-5 w-40 rounded" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
    <div className="skeleton rounded-lg" style={{ height }} />
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pagamentos'); // pagamentos | mensagens

  useEffect(() => {
    api.get('/dashboard/resumo')
      .then(res => setData(res.data.data))
      .catch(err => console.error('Erro ao carregar dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="skeleton h-7 w-52 rounded" />
            <div className="skeleton h-4 w-40 rounded" />
          </div>
          <div className="skeleton h-8 w-36 rounded-full" />
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 50, 100, 150, 200].map((d) => <SkeletonCard key={d} delay={d} />)}
        </div>

        {/* Chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonChart height={280} delay={200} />
          <div className="lg:col-span-2 order-first lg:order-last">
            <SkeletonChart height={280} delay={250} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <TrendingDown size={40} style={{ color: 'var(--text-3)' }} />
      <p style={{ color: 'var(--text-2)' }}>Erro ao carregar dados do dashboard.</p>
    </div>
  );

  const {
    membros, quotas, financeiro, fluxo_mensal,
    pagamentos_recentes = [], mensagens_pendentes = [],
    total_mensagens_pendentes = 0, devedores_alerta = [],
    quotas_mensal = []
  } = data;
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
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'var(--text-1)',
    boxShadow: 'var(--shadow-lg)',
    fontSize: '13px',
    fontWeight: 600,
    padding: '10px 14px',
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"
        style={{ animation: 'fadeUp 0.35s ease-out forwards' }}
      >
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Dashboard Executivo
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Visão geral em tempo real — SF-DGCI
          </p>
          <div className="page-header-accent" />
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            animation: 'slideInRight 0.4s ease-out 0.1s both',
          }}
        >
          <Calendar size={15} />
          {new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards — staggered entrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          delay={60}
          label="Total de Membros"
          value={membros?.total ?? 0}
          sub={<><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#10b981' }} /> {membros?.ativos} ativos</>}
          icon={Users}
          iconBg="rgba(59,111,245,0.1)"
          iconColor="#3b6ff5"
        />
        <KpiCard
          delay={120}
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
          delay={180}
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
          delay={240}
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
          delay={300}
          label="Saldo do Mês"
          value={formatXOF(saldoMes)}
          unit="XOF"
          sub={
            <>
              <ArrowUpRight size={12} style={{ display: 'inline' }} />
              {formatXOF(financeiro?.receitas_mes)}{' '}
              <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 3px' }}>|</span>
              <ArrowDownRight size={12} style={{ display: 'inline' }} />
              {formatXOF(financeiro?.despesas_mes)}
            </>
          }
          icon={DollarSign}
          accent="linear-gradient(135deg, #3b6ff5 0%, #6366f1 100%)"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart — Fluxo Financeiro */}
        <div
          className="card lg:col-span-2"
          style={{ animation: 'fadeUp 0.45s ease-out 0.35s both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,111,245,0.1)', color: 'var(--primary)' }}
              >
                <Activity size={16} />
              </span>
              Fluxo Financeiro Mensal
            </h3>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
            >
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
                cursor={{ fill: 'var(--surface-hover)', radius: 6 }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: 16, fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}
              />
              <Bar name="Receitas" dataKey="receitas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar name="Despesas" dataKey="despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — distribuição */}
        <div
          className="card"
          style={{ animation: 'fadeUp 0.45s ease-out 0.4s both' }}
        >
          <h3 className="font-bold text-base flex items-center gap-2 mb-5" style={{ color: 'var(--text-1)' }}>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
            >
              <PieChartIcon size={16} />
            </span>
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
                    animationBegin={200}
                    animationDuration={800}
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

              <div className="mt-3 space-y-2.5">
                {membrosDistrib.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((d.value / membrosDistrib.reduce((s,x)=>s+x.value,0)) * 64)}px`,
                          background: d.color,
                          opacity: 0.3,
                          minWidth: '12px',
                        }}
                      />
                      <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{d.value}</span>
                    </div>
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

      {/* ── Quotas Mensais Line Chart ── */}
      <div
        className="card"
        style={{ animation: 'fadeUp 0.45s ease-out 0.5s both' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}
            >
              <CreditCard size={16} />
            </span>
            Quotas Mensais — {new Date().getFullYear()}
          </h3>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            Pagas vs Pendentes
          </span>
        </div>
        {quotas_mensal.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={quotas_mensal.map(q => ({
                mes: MESES[q.mes - 1] || q.mes,
                Pagas: Number(q.pagas || 0),
                Pendentes: Number(q.pendentes || 0),
                'Valor (XOF)': Number(q.valor_pago || 0),
              }))}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPagas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="mes"
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                allowDecimals={false}
              />
              <RechartsTooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--surface-hover)', radius: 6 }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: 16, fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}
              />
              <Area
                type="monotone"
                dataKey="Pagas"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorPagas)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="Pendentes"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#colorPendentes)"
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-3)' }}>
            <p className="text-sm">Sem dados de quotas para este ano.</p>
          </div>
        )}
      </div>

      {/* ── Nova Secção: Actividade Recente e Alertas de Dívida ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Tab Panel: Actividade Recente (Pagamentos vs Mensagens) */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pagamentos')}
                className="text-sm font-bold pb-1.5 px-1 relative transition-all"
                style={{
                  color: activeTab === 'pagamentos' ? 'var(--primary)' : 'var(--text-3)'
                }}
              >
                Últimos Pagamentos
                {activeTab === 'pagamentos' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--primary)' }} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('mensagens')}
                className="text-sm font-bold pb-1.5 px-1 relative transition-all flex items-center gap-1.5"
                style={{
                  color: activeTab === 'mensagens' ? 'var(--primary)' : 'var(--text-3)'
                }}
              >
                Mensagens de Contacto
                {total_mensagens_pendentes > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">
                    {total_mensagens_pendentes}
                  </span>
                )}
                {activeTab === 'mensagens' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--primary)' }} />
                )}
              </button>
            </div>
            <Link
              to={activeTab === 'pagamentos' ? '/quotas' : '/mensagens'}
              className="text-xs font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2 min-h-[220px]">
            {activeTab === 'pagamentos' ? (
              pagamentos_recentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-3)' }}>
                  <Inbox size={32} className="opacity-40 mb-2" />
                  <p className="text-sm">Nenhum pagamento recente registado.</p>
                </div>
              ) : (
                pagamentos_recentes.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04]"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        {p.numero_membro || '#'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate max-w-[180px] sm:max-w-[320px]" style={{ color: 'var(--text-1)' }}>
                          {p.nome_completo}
                        </p>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                          <Clock size={11} />
                          {MESES[p.mes - 1]}/{p.ano} · Quota
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm text-green-500">
                        +{formatXOF(p.valor)} <span className="text-[10px] font-medium">XOF</span>
                      </p>
                      <p className="text-[10px] font-semibold text-white/50 bg-white/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        Pago
                      </p>
                    </div>
                  </div>
                ))
              )
            ) : (
              mensagens_pendentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-3)' }}>
                  <MessageSquare size={32} className="opacity-40 mb-2" />
                  <p className="text-sm">Sem mensagens pendentes de contacto.</p>
                </div>
              ) : (
                mensagens_pendentes.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04]"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
                      >
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate max-w-[200px]" style={{ color: 'var(--text-1)' }}>
                          {m.nome}
                        </p>
                        <p className="text-xs truncate max-w-[280px]" style={{ color: 'var(--text-3)' }}>
                          {m.assunto}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full inline-block">
                        Pendente
                      </p>
                      <p className="text-[10px] mt-1 block" style={{ color: 'var(--text-3)' }}>
                        {new Date(m.criado_em).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Alertas de Sistema / Devedores */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-1)' }}>
              <AlertCircle size={15} className="text-red-500" />
              Alertas de Dívida
            </h3>
            <span className="text-[10px] font-bold bg-red-500/15 text-red-500 px-2 py-0.5 rounded-full">
              Crítico (&gt;= 3 meses)
            </span>
          </div>

          <div className="space-y-2.5">
            {devedores_alerta.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: 'var(--text-3)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  ✓
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Nenhum membro crítico</p>
                <p className="text-xs mt-0.5">Todos os membros ativos estão com as quotas em dia.</p>
              </div>
            ) : (
              devedores_alerta.map((d, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate max-w-[150px]" style={{ color: 'var(--text-1)' }}>
                      {d.nome_completo}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Membro {d.numero_membro || '#'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded text-xs font-extrabold text-red-500 bg-red-500/10">
                      {d.meses_divida} meses
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/membros"
              className="btn text-center block w-full py-2 text-xs font-bold rounded-lg border border-dashed transition-all hover:bg-white/[0.02]"
              style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
            >
              Gerir Membros no Diretório
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
