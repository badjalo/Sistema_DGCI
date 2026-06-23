import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { FileText, Upload, Download, Search, File, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Documentos = () => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDocumentos = async () => {
    try {
      const { data } = await api.get('/documentos', { params: { search } });
      setDocumentos(data.data);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDocumentos();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const getFileIcon = (tipo, nome) => {
    if (tipo === 'pdf' || nome?.endsWith('.pdf')) return <FileText size={24} className="text-red-500" />;
    if (nome?.match(/\.(jpg|jpeg|png)$/i)) return <ImageIcon size={24} className="text-blue-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'geral',
    ficheiro: null
  });

  // Estado para modal de confirmação de eliminação
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/documentos/${docToDelete.id}`);
      toast.success(`Documento "${docToDelete.titulo}" eliminado com sucesso!`);
      setDocToDelete(null);
      fetchDocumentos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao eliminar documento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.ficheiro) return toast.error('Preencha os campos obrigatórios');

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('tipo', formData.tipo);
      data.append('ficheiro', formData.ficheiro);

      await api.post('/documentos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Documento carregado com sucesso!');
      setShowModal(false);
      setFormData({ titulo: '', tipo: 'geral', ficheiro: null });
      fetchDocumentos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao carregar documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2043] flex items-center gap-2">
            <FileText size={28} className="text-blue-600" />
            Arquivo Documental
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de estatutos, atas, contratos e circulares</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Upload size={18} /> Upload de Documento
        </button>
      </div>

      <div className="card">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar documento pelo título..."
            className="form-control pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ficheiro</th>
                <th>Categoria</th>
                <th>Tamanho</th>
                <th>Data</th>
                <th>Carregado por</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
              ) : documentos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhum documento encontrado.</td></tr>
              ) : (
                documentos.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                          {getFileIcon(doc.tipo, doc.ficheiro_nome)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{doc.titulo}</p>
                          <p className="text-xs text-gray-500">{doc.ficheiro_nome}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral capitalize">{doc.tipo}</span>
                    </td>
                    <td className="text-gray-500">{formatSize(doc.ficheiro_tamanho)}</td>
                    <td className="text-gray-500">{new Date(doc.criado_em).toLocaleDateString('pt-PT')}</td>
                    <td className="text-gray-500">{doc.carregado_por_nome || 'Sistema'}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={doc.ficheiro_url}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.ficheiro_nome}
                          className="btn btn-outline p-2"
                          title="Descarregar"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="btn p-2 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar documento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Upload size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Upload de Documento</h3>
                  <p className="text-xs text-slate-500">Suporta PDF, JPG, PNG, DOC</p>
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
              <form id="form-documento" onSubmit={handleUpload} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título do Documento</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ex: Ata da Reunião Março 2026"
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <div className="form-control-select-wrapper">
                    <select
                      className="form-control"
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      <option value="geral">Geral</option>
                      <option value="ata">Ata de Reunião</option>
                      <option value="estatuto">Estatuto</option>
                      <option value="contrato">Contrato</option>
                      <option value="circular">Circular</option>
                      <option value="relatorio">Relatório</option>
                      <option value="declaracao">Declaração</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ficheiro (PDF, JPG, PNG)</label>
                  <input
                    type="file"
                    required
                    className="form-control"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => setFormData({ ...formData, ficheiro: e.target.files[0] })}
                  />
                  <p className="text-xs text-slate-400 mt-1">Tamanho máximo: 10 MB</p>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-documento" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A enviar...' : 'Confirmar Upload'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal de Confirmação de Eliminação */}
      {docToDelete && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-sm">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Eliminar Documento</h3>
                  <p className="text-xs text-slate-500">Esta acção não pode ser revertida</p>
                </div>
              </div>
              <button
                onClick={() => setDocToDelete(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p className="text-gray-700 text-sm">
                Tem a certeza que deseja eliminar o documento
                <span className="font-bold text-gray-900"> "{docToDelete.titulo}"</span>?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                O ficheiro será removido permanentemente do sistema.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Documentos;
