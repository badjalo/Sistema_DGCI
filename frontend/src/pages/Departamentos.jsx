import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { Building, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Departamentos = () => {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      const { data } = await api.get('/departamentos');
      setDepartamentos(data.data);
    } catch (error) {
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    descricao: '',
    responsavel_nome: '',
    limite_quadros: 0,
    estado: true
  });

  const openModal = (dept = null) => {
    if (dept) {
      setEditId(dept.id);
      setFormData({
        nome: dept.nome,
        sigla: dept.sigla,
        descricao: dept.descricao || '',
        responsavel_nome: dept.responsavel_nome || '',
        limite_quadros: dept.limite_quadros || 0,
        estado: dept.estado
      });
    } else {
      setEditId(null);
      setFormData({ nome: '', sigla: '', descricao: '', responsavel_nome: '', limite_quadros: 0, estado: true });
    }
    setShowModal(true);
  };

  const handleNovoDepartamento = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.sigla) return toast.error('Nome e Sigla são obrigatórios');
    
    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/departamentos/${editId}`, formData);
        toast.success('Departamento atualizado!');
      } else {
        await api.post('/departamentos', formData);
        toast.success('Departamento criado com sucesso!');
      }
      setShowModal(false);
      fetchDepartamentos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao guardar departamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja eliminar o departamento ${nome}?`)) {
      try {
        await api.delete(`/departamentos/${id}`);
        toast.success('Departamento eliminado!');
        fetchDepartamentos();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Erro ao eliminar departamento');
      }
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;

  return (
    <div className="space-y-6 fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2043]">Departamentos / Serviços</h1>
          <p className="text-gray-500 text-sm">{departamentos.length} departamentos registados</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departamentos.map((dept) => (
          <div key={dept.id} className="card relative group hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{dept.nome}</h3>
                  <p className="text-sm text-gray-400 font-medium">{dept.sigla}</p>
                </div>
              </div>
              <span className={`badge ${dept.estado ? 'badge-success' : 'badge-danger'}`}>
                {dept.estado ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 line-clamp-2 h-10">
              {dept.descricao || 'Sem descrição'}
            </p>
            
            <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
              <div className="text-gray-500 flex flex-col">
                <span>
                  Membros Ativos: <span className="font-semibold text-gray-800">{dept.membros_ativos || 0}</span>
                </span>
                <span className="text-xs text-gray-400">
                  {dept.limite_quadros > 0 ? `Limite: ${dept.limite_quadros} quadros` : 'Capacidade ilimitada'}
                </span>
              </div>
              <div className="text-gray-500 text-right truncate pl-2 self-end">
                Resp: <span className="font-medium text-gray-700">{dept.responsavel_nome || 'N/A'}</span>
              </div>
            </div>

            {/* Actions overlay */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
              <button onClick={() => openModal(dept)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleEliminar(dept.id, dept.nome)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editId ? 'Editar Departamento' : 'Novo Departamento'}</h3>
                  <p className="text-xs text-slate-500">{editId ? 'Atualize os dados do departamento' : 'Preencha os dados para criar'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="modal-body">
              <form id="form-departamento" onSubmit={handleNovoDepartamento} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Nome do Departamento</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ex: Recursos Humanos"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Sigla</label>
                    <input
                      type="text"
                      required
                      className="form-control uppercase"
                      placeholder="Ex: RH"
                      maxLength={10}
                      value={formData.sigla}
                      onChange={e => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Responsável</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Opcional"
                      value={formData.responsavel_nome}
                      onChange={e => setFormData({...formData, responsavel_nome: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Limite de Quadros (Pessoal)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    placeholder="Ex: 10 (0 = ilimitado)"
                    value={formData.limite_quadros}
                    onChange={e => setFormData({...formData, limite_quadros: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Descrição breve do departamento..."
                    value={formData.descricao}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                  ></textarea>
                </div>

                {editId && (
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.estado}
                      onChange={e => setFormData({...formData, estado: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Departamento Ativo</span>
                  </label>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-departamento" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A guardar...' : (editId ? 'Atualizar' : 'Criar Departamento')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Departamentos;
