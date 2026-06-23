import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { MessageSquare, Plus, Bell, Clock, Trash2, Edit2, Heart, Upload, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TIPOS = [
  { value: 'aviso',        label: 'Aviso' },
  { value: 'circular',     label: 'Circular' },
  { value: 'convocatoria', label: 'Convocatória' },
  { value: 'informacao',   label: 'Informação' },
  { value: 'obito',        label: '⚰️ Óbito' },
];

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
    urgente: false,
    nome_falecido: '',
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileInputRef = useRef(null);

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
    setFotoFile(null);
    setFotoPreview(null);
    if (com) {
      setEditId(com.id);
      setFormData({
        titulo: com.titulo,
        tipo: com.tipo || 'aviso',
        conteudo: com.conteudo || '',
        estado: com.estado || 'rascunho',
        destino: com.destino || 'todos',
        urgente: !!com.urgente,
        nome_falecido: com.nome_falecido || '',
      });
      if (com.foto_url) setFotoPreview(com.foto_url);
    } else {
      setEditId(null);
      setFormData({
        titulo: '',
        tipo: 'aviso',
        conteudo: '',
        estado: 'rascunho',
        destino: 'todos',
        urgente: false,
        nome_falecido: '',
      });
    }
    setShowModal(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem não pode ultrapassar 5MB');
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.conteudo) return toast.error('Título e conteúdo são obrigatórios');
    if (formData.tipo === 'obito' && !formData.nome_falecido.trim()) {
      return toast.error('Por favor, indique o nome do falecido');
    }

    setIsSubmitting(true);
    try {
      // Usar FormData para suportar upload de ficheiro
      const fd = new FormData();
      fd.append('titulo', formData.titulo);
      fd.append('tipo', formData.tipo);
      fd.append('conteudo', formData.conteudo);
      fd.append('estado', formData.estado);
      fd.append('destino', formData.destino);
      fd.append('urgente', formData.urgente);
      fd.append('nome_falecido', formData.nome_falecido || '');
      if (fotoFile) fd.append('foto', fotoFile);

      if (editId) {
        await api.put(`/comunicados/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Comunicado atualizado!');
      } else {
        await api.post('/comunicados', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
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
    if (tipo === 'obito') return 'badge-secondary';
    if (tipo === 'aviso') return 'badge-warning';
    if (tipo === 'informacao') return 'badge-info';
    return 'badge-primary';
  };

  const getTipoLabel = (tipo) => {
    const found = TIPOS.find(t => t.value === tipo);
    return found ? found.label : tipo;
  };

  return (
    <>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold">Comunicação Interna</h1>
            <p className="text-gray-500 text-sm mt-2">Gestão de circulares, avisos, anúncios e comunicados de óbito</p>
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
              <div
                key={com.id}
                className="card flex-col group relative"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  height: '100%',
                  borderLeft: com.tipo === 'obito' ? '4px solid #6b7280' : undefined,
                }}
              >
                {/* Foto no card */}
                {com.foto_url && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <img
                      src={com.foto_url.startsWith('/api') ? `${import.meta.env.VITE_API_URL || ''}${com.foto_url}` : com.foto_url}
                      alt={com.nome_falecido || com.titulo}
                      className={`w-12 h-12 object-cover ring-2 ring-gray-300 ${com.tipo === 'obito' ? 'rounded-full' : 'rounded-lg'}`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      {com.tipo === 'obito' ? (
                        <>
                          <p className="text-xs text-gray-500 font-medium">Em memória de</p>
                          <p className="text-sm font-bold text-gray-800">{com.nome_falecido || '—'}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500 font-medium">Imagem de destaque</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">{com.foto_url.split('/').pop()}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <span className={`badge ${getBadgeClass(com.tipo, com.urgente)} uppercase text-[10px]`}>
                    {com.urgente ? 'Urgente' : getTipoLabel(com.tipo)}
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
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-2xl w-full">
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
                      <select
                        className="form-control"
                        value={formData.tipo}
                        onChange={e => setFormData({...formData, tipo: e.target.value, urgente: false})}
                      >
                        {TIPOS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
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

                {/* ── Secção especial para Óbito: Nome do Falecido ── */}
                {formData.tipo === 'obito' && (
                  <div className="form-group">
                    <label className="form-label">Nome do Falecido *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        required
                        className="form-control"
                        style={{ paddingLeft: '2.2rem' }}
                        placeholder="Nome completo do falecido"
                        value={formData.nome_falecido}
                        onChange={e => setFormData({...formData, nome_falecido: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* ── Upload de Imagem (Disponível para todas as categorias) ── */}
                <div className="form-group">
                  <label className="form-label">
                    {formData.tipo === 'obito' ? 'Foto do Falecido (opcional)' : 'Imagem de Destaque (opcional)'}
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #9ca3af',
                      borderRadius: '10px',
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: '#fff',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6b7280'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#9ca3af'}
                  >
                    {fotoPreview ? (
                      <>
                        <img
                          src={fotoPreview.startsWith('data:') ? fotoPreview : `${import.meta.env.VITE_API_URL || ''}${fotoPreview}`}
                          alt="Pré-visualização"
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: formData.tipo === 'obito' ? '50%' : '8px',
                            objectFit: 'cover',
                            border: '3px solid #d1d5db'
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Imagem selecionada</p>
                          <p className="text-xs text-gray-500">Clique para alterar</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFotoFile(null); setFotoPreview(null); }}
                          className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">
                            {formData.tipo === 'obito' ? 'Clique para carregar foto do falecido' : 'Clique para carregar imagem de destaque'}
                          </p>
                          <p className="text-xs text-gray-400">JPG, PNG ou WebP • máx. 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFotoChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Conteúdo</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    required
                    placeholder={formData.tipo === 'obito' ? 'Escreva a nota de pesar e informações sobre o falecimento...' : 'Escreva a mensagem aqui...'}
                    value={formData.conteudo}
                    onChange={e => setFormData({...formData, conteudo: e.target.value})}
                  ></textarea>
                </div>

                {formData.tipo !== 'obito' && (
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
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-comunicado" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A guardar...' : (editId ? 'Atualizar' : 'Publicar Comunicado')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Comunicados;
