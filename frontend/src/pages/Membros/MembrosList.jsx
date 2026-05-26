import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, Search, Plus, Filter, Edit2, Trash2, Eye, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const estadoBadge = (estado) => {
  const map = {
    ativo:     'badge-success',
    suspenso:  'badge-danger',
    reformado: 'badge-neutral',
    inativo:   'badge-neutral',
  };
  return map[estado] || 'badge-neutral';
};

const MembrosList = () => {
  const [membros, setMembros]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

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

  return (
    <div className="fade-in space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"
              style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            Gestão de Membros
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {pagination.total} membros registados no sistema
          </p>
        </div>
        <Link to="/membros/novo" className="btn btn-primary btn-sm sm:btn">
          <Plus size={16} /> Novo Membro
        </Link>
      </div>

      {/* Filters */}
      <div className="card py-3 px-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
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
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
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

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Membro</th>
              <th>Contacto</th>
              <th>Departamento / Cargo</th>
              <th>Estado</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-12">
                  <div className="spinner mx-auto" />
                </td>
              </tr>
            ) : membros.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users size={32} style={{ color: 'var(--text-3)' }} />
                    <p style={{ color: 'var(--text-3)' }}>Nenhum membro encontrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              membros.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
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
                      <Link to={`/membros/${m.id}`}
                            className="btn-icon" title="Ver Perfil">
                        <Eye size={16} style={{ color: 'var(--primary)' }} />
                      </Link>
                      <Link to={`/membros/${m.id}/editar`}
                            className="btn-icon" title="Editar">
                        <Edit2 size={16} style={{ color: 'var(--text-2)' }} />
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id, m.nome_completo)}
                        className="btn-icon" title="Eliminar"
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
        <div className="flex items-center justify-between">
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
