import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, RefreshCw, ChevronLeft, ChevronRight,
  User, Clock, Globe, Activity, AlertTriangle, CheckCircle,
  Trash2, Edit, Plus, LogIn, LogOut, Eye, Download, Filter, X
} from 'lucide-react';
import api from '../services/api';

// ─── Mapeamento de acções → estilo e ícone ─────────────────────────────────
const acaoConfig = {
  login:     { label: 'Login',     color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: LogIn },
  logout:    { label: 'Logout',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  Icon: LogOut },
  criar:     { label: 'Criação',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  Icon: Plus },
  atualizar: { label: 'Edição',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: Edit },
  eliminar:  { label: 'Eliminação',color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   Icon: Trash2 },
  visualizar:{ label: 'Consulta', color: '#64748b', bg: 'rgba(100,116,139,0.12)', Icon: Eye },
  exportar:  { label: 'Exportação',color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  Icon: Download },
  erro:      { label: 'Erro',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   Icon: AlertTriangle },
};

const getAcaoConfig = (acao = '') => {
  const key = acao.toLowerCase();
  for (const [k, v] of Object.entries(acaoConfig)) {
    if (key.includes(k)) return v;
  }
  return { label: acao, color: '#64748b', bg: 'rgba(100,116,139,0.12)', Icon: Activity };
};

// ─── Badge de Acção ─────────────────────────────────────────────────────────
const AcaoBadge = ({ acao }) => {
  const { label, color, bg, Icon } = getAcaoConfig(acao);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ color, background: bg }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
};

// ─── Formatador de data ─────────────────────────────────────────────────────
const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso; }
};

// ─── Skeleton Row ────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5].map((i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 rounded" style={{ width: `${60 + i * 15}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25 });

  // Filtros
  const [search, setSearch] = useState('');
  const [acaoFilter, setAcaoFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (acaoFilter) params.acao = acaoFilter;

      const res = await api.get('/auditoria', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination((prev) => ({ ...prev, ...res.data.pagination, page }));
      }
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setLoading(false);
    }
  }, [acaoFilter, pagination.limit]);

  useEffect(() => {
    fetchLogs(1);
  }, [acaoFilter]);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Filtro local por search (nome/módulo/IP)
  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.utilizador_nome_completo || log.utilizador_nome || '').toLowerCase().includes(q) ||
      (log.entidade || log.modulo || '').toLowerCase().includes(q) ||
      (log.ip_address || log.ip || '').toLowerCase().includes(q) ||
      (log.acao || '').toLowerCase().includes(q)
    );
  });

  const acoes = [
    '', 'login', 'logout', 'criar', 'atualizar', 'eliminar', 'visualizar', 'exportar',
  ];

  return (
    <div className="space-y-6 fade-in">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
            >
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>
              Auditoria do Sistema
            </h1>
          </div>
          <p className="text-sm ml-13 pl-1" style={{ color: 'var(--text-3)', paddingLeft: '52px' }}>
            Registo completo de todas as acções dos utilizadores
          </p>
          <div className="page-header-accent" />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            {pagination.total.toLocaleString('pt-PT')} registos
          </span>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10 active:scale-95"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
            title="Atualizar"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Pesquisa */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Pesquisar por utilizador, módulo ou IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-3)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtro por acção */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <select
              value={acaoFilter}
              onChange={(e) => setAcaoFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg text-sm appearance-none cursor-pointer"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                outline: 'none',
                minWidth: '160px',
              }}
            >
              <option value="">Todas as acções</option>
              {acoes.filter(Boolean).map((a) => (
                <option key={a} value={a}>
                  {acaoConfig[a]?.label || a}
                </option>
              ))}
            </select>
          </div>

          {(search || acaoFilter) && (
            <button
              onClick={() => { setSearch(''); setAcaoFilter(''); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <X size={14} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  Acção
                </th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  Utilizador
                </th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-3)' }}>
                  Módulo
                </th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-3)' }}>
                  IP
                </th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  Data / Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                    <p className="font-semibold" style={{ color: 'var(--text-2)' }}>Nenhum registo encontrado</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                      Tente ajustar os filtros de pesquisa
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Acção */}
                    <td className="px-4 py-3">
                      <AcaoBadge acao={log.acao} />
                    </td>

                    {/* Utilizador */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                          style={{ background: 'linear-gradient(135deg,#3b6ff5,#6366f1)' }}
                        >
                          {(log.utilizador_nome_completo || log.utilizador_nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-1)' }}>
                            {log.utilizador_nome_completo || log.utilizador_nome || 'Sistema'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Módulo */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                      >
                        {log.entidade || log.modulo || '—'}
                      </span>
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <Globe size={12} />
                        <span className="font-mono text-xs">{log.ip_address || log.ip || '—'}</span>
                      </div>
                    </td>

                    {/* Data/Hora */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <Clock size={12} />
                        <span className="text-xs whitespace-nowrap">
                          {formatDateTime(log.criado_em || log.data)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginação ────────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Página <span className="font-bold" style={{ color: 'var(--text-2)' }}>{pagination.page}</span> de{' '}
              <span className="font-bold" style={{ color: 'var(--text-2)' }}>{totalPages}</span>
              {' '}· {pagination.total.toLocaleString('pt-PT')} registos no total
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                style={{ color: 'var(--text-2)' }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = pagination.page <= 4
                  ? i + 1
                  : pagination.page + i - 3;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => fetchLogs(page)}
                    className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: page === pagination.page ? 'var(--primary)' : 'transparent',
                      color: page === pagination.page ? '#fff' : 'var(--text-2)',
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="p-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                style={{ color: 'var(--text-2)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cards de Resumo ──────────────────────────────────────────────────── */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(acaoConfig).slice(0, 4).map(([key, cfg]) => {
            const count = logs.filter((l) => (l.acao || '').toLowerCase().includes(key)).length;
            if (count === 0) return null;
            return (
              <div
                key={key}
                className="card flex items-center gap-3 cursor-pointer transition-all hover:shadow-md"
                onClick={() => setAcaoFilter(key)}
                style={{ padding: '1rem' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <cfg.Icon size={18} />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-none" style={{ color: 'var(--text-1)' }}>{count}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Auditoria;
