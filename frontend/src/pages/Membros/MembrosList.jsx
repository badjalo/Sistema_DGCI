import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, Search, Plus, Filter, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MembrosList = () => {
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchMembros = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/membros', {
        params: { page: pagination.page, limit: pagination.limit, search, estado: estadoFilter }
      });
      setMembros(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembros();
  }, [pagination.page, estadoFilter]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchMembros();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleDelete = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja eliminar o membro ${nome}?`)) {
      try {
        await api.delete(`/membros/${id}`);
        toast.success('Membro eliminado com sucesso');
        fetchMembros();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Erro ao eliminar membro');
      }
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2043] flex items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Gestão de Membros
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} membros registados no sindicato
          </p>
        </div>
        <Link to="/membros/novo" className="btn btn-primary w-full md:w-auto">
          <Plus size={18} /> Novo Membro
        </Link>
      </div>

      <div className="card">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por nome, nº membro, NIF..."
              className="form-control pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="form-control pl-12 appearance-none"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
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
                  <td colSpan="5" className="text-center py-8">
                    <div className="spinner mx-auto"></div>
                  </td>
                </tr>
              ) : membros.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                membros.map((membro) => (
                  <tr key={membro.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {membro.foto_url ? (
                            <img src={membro.foto_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            membro.nome_completo.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{membro.nome_completo}</p>
                          <p className="text-xs text-gray-500">{membro.numero_membro}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">{membro.telefone || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{membro.email || 'N/A'}</p>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900 truncate max-w-[200px]" title={membro.departamento_nome}>
                        {membro.departamento_nome || 'Sem Departamento'}
                      </p>
                      <p className="text-xs text-gray-500">{membro.cargo_nome || membro.funcao_cargo || 'S/ Cargo'}</p>
                    </td>
                    <td>
                      <span className={`badge ${membro.estado === 'ativo' ? 'badge-success' :
                        membro.estado === 'suspenso' ? 'badge-warning' :
                          membro.estado === 'reformado' ? 'badge-info' : 'badge-neutral'
                        }`}>
                        {membro.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/membros/${membro.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver Perfil">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/membros/${membro.id}/editar`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Editar">
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(membro.id, membro.nome_completo)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
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
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Mostrando página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.pages}</span>
            </p>
            <div className="flex gap-1">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembrosList;
