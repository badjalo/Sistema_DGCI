import React, { useState, useEffect } from 'react';
import {
  Download, FileText, Users, CreditCard, DollarSign,
  BarChart3, Calendar, TrendingUp, TrendingDown, RefreshCw,
  Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../services/api';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const formatXOF = (val) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(Number(val || 0));

// ─── KPI Card simples ────────────────────────────────────────────────────────
const KpiMini = ({ label, value, unit = '', sub, color, icon: Icon, bg }) => (
  <div className="card" style={{ padding: '1rem' }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className="text-xl font-extrabold" style={{ color: 'var(--text-1)' }}>
          {value} {unit && <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{unit}</span>}
        </p>
        {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, color }}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

// ─── Report Card ─────────────────────────────────────────────────────────────
const ReportCard = ({ report, ano, onExport, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = report.icon;
  const isLoadingPdf   = loading === `${report.id}-pdf`;
  const isLoadingExcel = loading === `${report.id}-excel`;
  const isAnyLoading   = isLoadingPdf || isLoadingExcel;

  return (
    <div className="card transition-all hover:shadow-md" style={{ padding: '1.25rem' }}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl flex-shrink-0 ${report.bg}`}>
          <Icon size={24} className={report.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>{report.title}</h3>
              <p className="text-sm mt-0.5 mb-4" style={{ color: 'var(--text-3)' }}>{report.desc}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onExport(report.id, report.title, 'pdf')}
              disabled={isAnyLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              {isLoadingPdf
                ? <RefreshCw size={13} className="animate-spin" />
                : <Download size={13} />}
              PDF
            </button>
            <button
              type="button"
              onClick={() => onExport(report.id, report.title, 'excel')}
              disabled={isAnyLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
            >
              {isLoadingExcel
                ? <RefreshCw size={13} className="animate-spin" />
                : <Download size={13} />}
              Excel
            </button>
            <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
              Ano {ano}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Relatorios = () => {
  const [loadingReport, setLoadingReport] = useState(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [resumo, setResumo] = useState(null);
  const [loadingResumo, setLoadingResumo] = useState(true);

  // Anos disponíveis (últimos 5 anos)
  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchResumo();
  }, [ano]);

  const fetchResumo = async () => {
    setLoadingResumo(true);
    try {
      const res = await api.get('/relatorios', { params: { ano } });
      if (res.data.success) setResumo(res.data.data);
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
    } finally {
      setLoadingResumo(false);
    }
  };

  const handleExport = async (tipo, titulo, format) => {
    setLoadingReport(`${tipo}-${format}`);
    try {
      const response = await api.get('/relatorios/export', {
        params: { tipo, format, ano },
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.href = url;
      link.download = `${tipo}_${ano}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Relatório "${titulo}" gerado com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar o relatório');
    } finally {
      setLoadingReport(null);
    }
  };

  const reports = [
    {
      id: 'membros',
      title: 'Diretório de Membros',
      desc: 'Lista completa de membros com contactos, departamentos e estado actual.',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
    },
    {
      id: 'quotas_divida',
      title: 'Quota e Fundo Social (Dívidas)',
      desc: 'Membros com quota e fundo social em atraso: meses não pagos e montante em dívida.',
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-100',
    },
    {
      id: 'quotas_pagas',
      title: 'Quota e Fundo Social (Pagas)',
      desc: 'Extrato de quotas e fundo social pagos no ano seleccionado para contabilidade.',
      icon: CreditCard,
      color: 'text-green-500',
      bg: 'bg-green-100',
    },
    {
      id: 'movimentos',
      title: 'Extrato Financeiro',
      desc: 'Fluxo completo de entradas e saídas de caixa do sindicato no ano seleccionado.',
      icon: DollarSign,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      id: 'auditoria',
      title: 'Logs de Auditoria',
      desc: 'Registo das últimas 1000 acções de sistema dos utilizadores administrativos.',
      icon: FileText,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
    },
  ];

  // Gráfico fluxo mensal
  const fluxoData = (resumo?.fluxo_mensal || []).map((item) => ({
    mes: MESES[Number(item.mes) - 1] || item.mes,
    receitas: Number(item.receitas || 0),
    despesas: Number(item.despesas || 0),
  }));

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    fontSize: '12px',
    fontWeight: 600,
  };

  return (
    <div className="space-y-6 fade-in">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <BarChart3 size={20} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>
              Mapas e Relatórios
            </h1>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', paddingLeft: '52px' }}>
            Geração e exportação de dados do sistema em PDF e Excel
          </p>
          <div className="page-header-accent" />
        </div>

        {/* Seletor de Ano */}
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--text-3)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Ano:</span>
          <div className="flex gap-1">
            {anos.map((y) => (
              <button
                key={y}
                onClick={() => setAno(y)}
                className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: y === ano ? 'var(--primary)' : 'var(--surface-2)',
                  color: y === ano ? '#fff' : 'var(--text-2)',
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs de Resumo ──────────────────────────────────────────────────── */}
      {loadingResumo ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className="card" style={{ padding: '1rem' }}>
              <div className="skeleton h-3 w-24 rounded mb-3" />
              <div className="skeleton h-6 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMini
            label="Total de Membros"
            value={resumo.membros?.total ?? 0}
            sub={`${resumo.membros?.ativos ?? 0} activos`}
            color="#10b981"
            icon={Users}
            bg="rgba(16,185,129,0.1)"
          />
          <KpiMini
            label="Quotas Cobradas"
            value={formatXOF(resumo.totais?.quotas_cobradas)}
            unit="XOF"
            sub={`Ano ${ano}`}
            color="#3b82f6"
            icon={CreditCard}
            bg="rgba(59,130,246,0.1)"
          />
          <KpiMini
            label="Receitas Totais"
            value={formatXOF(resumo.totais?.receitas)}
            unit="XOF"
            sub="Entradas do ano"
            color="#10b981"
            icon={TrendingUp}
            bg="rgba(16,185,129,0.1)"
          />
          <KpiMini
            label="Saldo do Ano"
            value={formatXOF(resumo.totais?.saldo)}
            unit="XOF"
            sub={resumo.totais?.saldo >= 0 ? 'Positivo ✓' : 'Negativo ✗'}
            color={resumo.totais?.saldo >= 0 ? '#10b981' : '#ef4444'}
            icon={DollarSign}
            bg={resumo.totais?.saldo >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
          />
        </div>
      )}

      {/* ── Gráfico Fluxo Mensal ─────────────────────────────────────────── */}
      {!loadingResumo && fluxoData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <BarChart3 size={15} />
              </span>
              Fluxo Financeiro — {ano}
            </h3>
            <div className="flex items-center gap-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Receitas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Despesas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fluxoData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 11 }} dy={6} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [`${formatXOF(v)} XOF`, name === 'receitas' ? 'Receitas' : 'Despesas']}
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--surface-hover)', radius: 4 }}
              />
              <Bar dataKey="receitas" fill="#10b981" radius={[5,5,0,0]} barSize={14} />
              <Bar dataKey="despesas" fill="#f87171" radius={[5,5,0,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Cards de Relatório ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>
          Exportar Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              ano={ano}
              onExport={handleExport}
              loading={loadingReport}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
