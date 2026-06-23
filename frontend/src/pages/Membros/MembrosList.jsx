import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, Search, Plus, Filter, Edit2, Trash2, Eye, Heart,
  ChevronLeft, ChevronRight, CheckSquare, CreditCard, RefreshCw, Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';

const estadoBadge = (estado) => {
  const map = {
    ativo:     'badge-success',
    suspenso:  'badge-danger',
    reformado: 'badge-neutral',
    inativo:   'badge-neutral',
  };
  return map[estado] || 'badge-neutral';
};

/* Skeleton row */
const SkeletonRow = ({ delay = 0 }) => (
  <tr style={{ animation: `fadeUp 0.3s ease-out ${delay}ms both` }}>
    <td><div className="skeleton w-4 h-4 rounded" /></td>
    <td>
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-2 w-20 rounded" />
        </div>
      </div>
    </td>
    <td><div className="skeleton h-3 w-24 rounded" /></td>
    <td><div className="skeleton h-3 w-28 rounded" /></td>
    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
    <td><div className="flex justify-end gap-1">
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="skeleton w-8 h-8 rounded-lg" />
      <div className="skeleton w-8 h-8 rounded-lg" />
    </div></td>
  </tr>
);

const MembrosList = () => {
  const [membros, setMembros]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [pagination, setPagination]     = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Batch selection
  const [selectedIds, setSelectedIds]               = useState([]);
  const [exportingCards, setExportingCards]          = useState(false);

  const fetchMembros = async (page = pagination.page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/membros', {
        params: { page, limit: pagination.limit, search, estado: estadoFilter }
      });
      setMembros(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembros(1); }, [estadoFilter]);
  useEffect(() => {
    const t = setTimeout(() => fetchMembros(1), 450);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { fetchMembros(); }, [pagination.page]);

  // Clear selection when list changes
  useEffect(() => { setSelectedIds([]); }, [membros]);

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? membros.map(m => m.id) : []);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Eliminar o membro "${nome}"?`)) return;
    try {
      await api.delete(`/membros/${id}`);
      toast.success('Membro eliminado com sucesso');
      fetchMembros();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao eliminar membro');
    }
  };

  const handleExportCartoesLote = async () => {
    if (!selectedIds.length) {
      toast.error('Nenhum membro selecionado.');
      return;
    }

    setExportingCards(true);
    const t = toast.loading(`A gerar ${selectedIds.length} cartão(ões) PDF para impressão PVC...`);

    try {
      const response = await api.post(
        '/membros/cartao/lote',
        { membro_ids: selectedIds },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cartoes_membros_lote_${selectedIds.length}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(t);
      toast.success(`${selectedIds.length} cartão(ões) exportado(s) com sucesso!`);
      setSelectedIds([]);
    } catch (err) {
      toast.dismiss(t);
      toast.error(err.response?.data?.error || 'Erro ao gerar cartões em lote.');
    } finally {
      setExportingCards(false);
    }
  };

  const allSelected = membros.length > 0 && selectedIds.length === membros.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < membros.length;

  return (
    <div className="space-y-5 fade-in">

      <PageHeader
        icon={Users}
        title="Gestão de Membros"
        subtitle={`${pagination.total} membros registados no sistema`}
        actions={
          <Link to="/membros/novo" className="btn btn-primary">
            <Plus size={16} /> Novo Membro
          </Link>
        }
      />

      {/* Filters */}
      <div
        className="card py-3 px-4"
        style={{ animation: 'fadeUp 0.35s ease-out 0.1s both' }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-3)' }}
            />
            <input
              type="text"
              placeholder="Pesquisar por nome, nº membro, NIF..."
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative sm:w-52">
            <Filter
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-3)' }}
            />
            <select
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
            >
              <option value="">Todos os Estados</option>
              <option value="ativo">Ativos</option>
              <option value="suspenso">Suspensos</option>
              <option value="reformado">Reformados</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div
          className="card border-indigo-500/30 bg-indigo-500/5 p-4 flex items-center justify-between gap-4 fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="text-indigo-400" size={20} />
            <span className="text-sm font-bold text-indigo-400">
              {selectedIds.length} {selectedIds.length === 1 ? 'membro selecionado' : 'membros selecionados'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-secondary text-xs py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportCartoesLote}
              disabled={exportingCards}
              className="btn btn-primary text-xs py-1.5 flex items-center gap-1.5"
            >
              {exportingCards
                ? <><RefreshCw size={13} className="animate-spin" /> A gerar PDF...</>
                : <><CreditCard size={13} /> Exportar Cartões PDF ({selectedIds.length})</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="table-container"
        style={{ animation: 'fadeUp 0.4s ease-out 0.15s both' }}
      >
        <table className="table">
          <thead>
            <tr>
              <th className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </th>
              <th>Membro</th>
              <th>Contacto</th>
              <th>Departamento / Cargo</th>
              <th>Estado</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} delay={i * 40} />
              ))
            ) : membros.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-16">
                  <div
                    className="flex flex-col items-center gap-3"
                    style={{ animation: 'fadeUp 0.3s ease-out' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      <Users size={28} style={{ color: 'var(--text-3)' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-2)' }}>
                        Nenhum membro encontrado
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {search || estadoFilter ? 'Tente ajustar os filtros' : 'Adicione o primeiro membro'}
                      </p>
                    </div>
                    {!search && !estadoFilter && (
                      <Link to="/membros/novo" className="btn btn-primary btn-sm mt-1">
                        <Plus size={14} /> Novo Membro
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              membros.map((m, idx) => (
                <tr
                  key={m.id}
                  style={{ animation: `fadeUp 0.3s ease-out ${idx * 30}ms both` }}
                  className={selectedIds.includes(m.id) ? 'bg-indigo-500/5' : ''}
                >
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => handleToggleSelect(m.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                      >
                        {m.foto_url
                          ? <img src={m.foto_url} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                          : m.nome_completo.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
                          {m.nome_completo}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{m.numero_membro}</span>
                          {m.fundo_social && (
                            <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 6px' }}>
                              <Heart size={9} /> Fundo Social
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm" style={{ color: 'var(--text-1)' }}>{m.telefone || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{m.email || '—'}</p>
                  </td>
                  <td>
                    <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--text-1)' }}>
                      {m.departamento_nome || 'Sem Departamento'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {m.cargo_nome || m.funcao_cargo || 'S/ Cargo'}
                    </p>
                  </td>
                  <td>
                    <span className={`badge ${estadoBadge(m.estado)}`}>{m.estado}</span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/membros/${m.id}`} className="btn-icon" title="Ver Perfil">
                        <Eye size={16} style={{ color: 'var(--primary)' }} />
                      </Link>
                      <Link to={`/membros/${m.id}/editar`} className="btn-icon" title="Editar">
                        <Edit2 size={16} style={{ color: 'var(--text-2)' }} />
                      </Link>
                      <Link to={`/membros/${m.id}/cartao`} className="btn-icon" title="Ver Cartão">
                        <CreditCard size={16} style={{ color: '#8b5cf6' }} />
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id, m.nome_completo)}
                        className="btn-icon"
                        title="Eliminar"
                      >
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div
          className="flex items-center justify-between"
          style={{ animation: 'fadeUp 0.3s ease-out 0.2s both' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Página <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{pagination.page}</span> de{' '}
            <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{pagination.pages}</span>
            {' '}— {pagination.total} total
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="btn btn-outline btn-sm gap-1"
            >
              <ChevronLeft size={15} /> Anterior
            </button>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="btn btn-outline btn-sm gap-1"
            >
              Próxima <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembrosList;
