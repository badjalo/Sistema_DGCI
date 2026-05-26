import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Plus, Bell, Clock, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Comunicados = () => {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'aviso',
    conteudo: '',
    estado: 'rascunho',
    destino: 'todos',
    urgente: false
  });

  const fetchComunicados = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/comunicados');
      setComunicados(data.data);
    } catch (error) {
      toast.error('Erro ao carregar comunicados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComunicados();
  }, []);

  const openModal = (com = null) => {
    if (com) {
      setEditId(com.id);
      setFormData({
        titulo: com.titulo,
        tipo: com.tipo || 'aviso',
        conteudo: com.conteudo || '',
        estado: com.estado || 'rascunho',
        destino: com.destino || 'todos',
        urgente: !!com.urgente
      });
    } else {
      setEditId(null);
      setFormData({
        titulo: '',
        tipo: 'aviso',
        conteudo: '',
        estado: 'rascunho',
        destino: 'todos',
        urgente: false
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.conteudo) return toast.error('Título e conteúdo são obrigatórios');
    
    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/comunicados/${editId}`, formData);
        toast.success('Comunicado atualizado!');
      } else {
        await api.post('/comunicados', formData);
        toast.success('Comunicado criado com sucesso!');
      }
      setShowModal(false);
      fetchComunicados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao guardar comunicado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (id, titulo) => {
    if (window.confirm(`Tem certeza que deseja eliminar o comunicado "${titulo}"?`)) {
      try {
        await api.delete(`/comunicados/${id}`);
        toast.success('Comunicado eliminado!');
        fetchComunicados();
      } catch (error) {
        toast.error('Erro ao eliminar comunicado');
      }
    }
  };

  const getBadgeClass = (tipo, urgente) => {
    if (urgente) return 'badge-danger';
    if (tipo === 'aviso') return 'badge-warning';
    if (tipo === 'informacao') return 'badge-info';
    return 'badge-primary';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Comunicação Interna</h1>
          <p className="text-gray-500 text-sm mt-2">Gestão de circulares, avisos e anúncios gerais</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Novo Comunicado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center p-8"><div className="spinner"></div></div>
        ) : comunicados.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-500 card">Nenhum comunicado registado.</div>
        ) : (
          comunicados.map(com => (
            <div key={com.id} className="card flex-col group relative" style={{ display: 'flex', gap: '1rem', height: '100%' }}>
              <div className="flex justify-between items-start mb-2">
                <span className={`badge ${getBadgeClass(com.tipo, com.urgente)} uppercase text-[10px]`}>
                  {com.urgente ? 'Urgente' : com.tipo}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(com)} className="btn-icon bg-gray-50"><Edit2 size={16}/></button>
                  <button onClick={() => handleEliminar(com.id, com.titulo)} className="btn-icon bg-red-50 text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{com.titulo}</h3>
              <p className="text-sm text-gray-600 flex-1 line-clamp-3">{com.conteudo}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(com.criado_em).toLocaleDateString('pt-PT')}</span>
                <span className="flex items-center gap-1">
                  <Bell size={14}/> 
                  {com.estado === 'publicado' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-lg">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editId ? 'Editar Comunicado' : 'Novo Comunicado'}</h3>
                  <p className="text-xs text-slate-500">{editId ? 'Atualize os detalhes abaixo' : 'Preencha os campos para publicar'}</p>
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
              <form id="form-comunicado" onSubmit={handleSave} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Título do comunicado"
                    value={formData.titulo}
                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <div className="form-control-select-wrapper">
                      <select className="form-control" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        <option value="aviso">Aviso</option>
                        <option value="circular">Circular</option>
                        <option value="convocatoria">Convocatória</option>
                        <option value="informacao">Informação</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <div className="form-control-select-wrapper">
                      <select className="form-control" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                        <option value="rascunho">Rascunho</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Conteúdo</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    required
                    placeholder="Escreva a mensagem aqui..."
                    value={formData.conteudo}
                    onChange={e => setFormData({...formData, conteudo: e.target.value})}
                  ></textarea>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-red-100 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.urgente}
                    onChange={e => setFormData({...formData, urgente: e.target.checked})}
                    className="w-4 h-4 text-red-600 rounded border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-red-700">Marcar como Urgente</span>
                    <p className="text-xs text-red-500">Será destacado visualmente para todos os membros</p>
                  </div>
                </label>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-comunicado" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A guardar...' : (editId ? 'Atualizar' : 'Publicar Comunicado')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comunicados;
