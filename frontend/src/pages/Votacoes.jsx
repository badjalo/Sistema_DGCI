import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Vote, Plus, Calendar, CheckCircle2, BarChart2, Trash2, ToggleLeft, ToggleRight, Info, PlusCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const Votacoes = () => {
  const { user } = useAuth();
  const [votacoes, setVotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVotacao, setSelectedVotacao] = useState(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
  const [tab, setTab] = useState('ativas'); // 'ativas' | 'terminadas' | 'admin'

  // Form para nova votação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: new Date().toISOString().slice(0, 16),
    data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    opcoes: ['', '']
  });

  const isAdminOrSecretario = user?.perfil === 'administrador' || user?.perfil === 'secretario';

  const fetchVotacoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/votacoes');
      if (res.data.success) {
        setVotacoes(res.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar votações/sondagens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotacoes();
  }, [fetchVotacoes]);

  // Carregar detalhes de uma votação (ex: após votar ou ao selecionar)
  const loadVotacaoDetalhe = async (id) => {
    try {
      const res = await api.get(`/votacoes/${id}`);
      if (res.data.success) {
        setSelectedVotacao(res.data.data);
      }
    } catch (error) {
      toast.error('Erro ao obter detalhes da votação');
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!opcaoSelecionada) return toast.error('Selecione uma opção para votar!');
    
    try {
      const res = await api.post(`/votacoes/${selectedVotacao.id}/votar`, { opcao_id: opcaoSelecionada });
      if (res.data.success) {
        toast.success(res.data.message || 'Voto registado com sucesso!');
        setOpcaoSelecionada('');
        // Recarregar dados
        await fetchVotacoes();
        await loadVotacaoDetalhe(selectedVotacao.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registar voto');
    }
  };

  const handleCreateVotacao = async (e) => {
    e.preventDefault();
    const cleanOpcoes = formData.opcoes.filter(o => o.trim() !== '');
    if (cleanOpcoes.length < 2) {
      return toast.error('Adicione pelo menos 2 opções válidas de voto.');
    }

    try {
      const res = await api.post('/votacoes', {
        ...formData,
        opcoes: cleanOpcoes
      });
      if (res.data.success) {
        toast.success('Votação criada com sucesso!');
        setShowCreateModal(false);
        setFormData({
          titulo: '',
          descricao: '',
          data_inicio: new Date().toISOString().slice(0, 16),
          data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          opcoes: ['', '']
        });
        fetchVotacoes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar votação');
    }
  };

  const handleToggleVotacao = async (id, currentStatus) => {
    try {
      const res = await api.put(`/votacoes/${id}`, { ativa: !currentStatus });
      if (res.data.success) {
        toast.success(`Votação ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
        fetchVotacoes();
        if (selectedVotacao?.id === id) {
          loadVotacaoDetalhe(id);
        }
      }
    } catch (error) {
      toast.error('Erro ao alterar estado da votação');
    }
  };

  const handleDeleteVotacao = async (id) => {
    if (!window.confirm('Tem certeza de que deseja eliminar esta votação? Esta ação é irreversível.')) return;
    try {
      const res = await api.delete(`/votacoes/${id}`);
      if (res.data.success) {
        toast.success('Votação eliminada com sucesso!');
        setSelectedVotacao(null);
        fetchVotacoes();
      }
    } catch (error) {
      toast.error('Erro ao eliminar votação');
    }
  };

  const addOptionField = () => {
    setFormData({ ...formData, opcoes: [...formData.opcoes, ''] });
  };

  const removeOptionField = (index) => {
    const updated = [...formData.opcoes];
    updated.splice(index, 1);
    setFormData({ ...formData, opcoes: updated });
  };

  const handleOptionChange = (index, value) => {
    const updated = [...formData.opcoes];
    updated[index] = value;
    setFormData({ ...formData, opcoes: updated });
  };

  // Filtragem
  const agora = new Date();
  const ativas = votacoes.filter(v => v.ativa && new Date(v.data_inicio) <= agora && new Date(v.data_fim) >= agora);
  const terminadas = votacoes.filter(v => !v.ativa || new Date(v.data_fim) < agora);

  const getPercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Vote}
        title="Votações & Sondagens Online"
        subtitle="Participe de consultas democráticas e sondagens promovidas pela direção sindical"
        actions={
          isAdminOrSecretario && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={18} /> Criar Sondagem
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => { setTab('ativas'); setSelectedVotacao(null); }}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${tab === 'ativas' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'}`}
        >
          Sondagens Ativas ({ativas.length})
        </button>
        <button
          onClick={() => { setTab('terminadas'); setSelectedVotacao(null); }}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${tab === 'terminadas' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'}`}
        >
          Histórico / Terminadas ({terminadas.length})
        </button>
        {isAdminOrSecretario && (
          <button
            onClick={() => { setTab('admin'); setSelectedVotacao(null); }}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${tab === 'admin' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'}`}
          >
            Gestão Administrativa ({votacoes.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Votações */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Selecione uma sondagem
          </h3>
          {loading ? (
            <div className="flex justify-center py-10"><div className="spinner"></div></div>
          ) : (tab === 'ativas' ? ativas : tab === 'terminadas' ? terminadas : votacoes).length === 0 ? (
            <div className="card text-center py-8 text-slate-500">
              Nenhuma sondagem encontrada nesta secção.
            </div>
          ) : (
            (tab === 'ativas' ? ativas : tab === 'terminadas' ? terminadas : votacoes).map((v) => (
              <div
                key={v.id}
                onClick={() => loadVotacaoDetalhe(v.id)}
                className={`card cursor-pointer hover:border-blue-400 transition-all ${selectedVotacao?.id === v.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{v.titulo}</h4>
                  {v.ja_votou && (
                    <span className="flex-shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> Votou
                    </span>
                  )}
                </div>
                <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-2)' }}>{v.descricao}</p>
                
                <div className="flex items-center justify-between mt-4 text-[10px]" style={{ color: 'var(--text-3)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(v.data_fim).toLocaleDateString('pt-GW')}
                  </span>
                  <span className="font-semibold">{v.total_votos || 0} votos</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhe e Voto */}
        <div className="lg:col-span-2">
          {selectedVotacao ? (
            <div className="card space-y-6">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{selectedVotacao.titulo}</h3>
                  {isAdminOrSecretario && tab === 'admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleVotacao(selectedVotacao.id, selectedVotacao.ativa)}
                        className="btn-icon p-1.5 rounded-lg"
                        title={selectedVotacao.ativa ? 'Desativar' : 'Ativar'}
                      >
                        {selectedVotacao.ativa ? <ToggleRight size={22} className="text-blue-500" /> : <ToggleLeft size={22} className="text-slate-400" />}
                      </button>
                      <button
                        onClick={() => handleDeleteVotacao(selectedVotacao.id)}
                        className="btn-icon p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{selectedVotacao.descricao}</p>
              </div>

              {/* Informações da Sondagem */}
              <div className="flex items-center gap-4 text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                  <Calendar size={14} />
                  <span>Fim: <strong>{new Date(selectedVotacao.data_fim).toLocaleString('pt-GW')}</strong></span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                  <Info size={14} />
                  <span>Estado: <strong className={selectedVotacao.ativa && new Date(selectedVotacao.data_fim) >= new Date() ? 'text-green-500' : 'text-red-500'}>
                    {selectedVotacao.ativa && new Date(selectedVotacao.data_fim) >= new Date() ? 'Ativa' : 'Terminada'}
                  </strong></span>
                </div>
              </div>

              {/* Formulário de Voto ou Resultados */}
              {selectedVotacao.ja_votou || (!selectedVotacao.ativa || new Date(selectedVotacao.data_fim) < agora) ? (
                // Mostrar Resultados
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                    <BarChart2 size={18} className="text-blue-500" />
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Resultados Parciais / Finais</h4>
                  </div>
                  <div className="space-y-4">
                    {selectedVotacao.opcoes.map((opcao) => {
                      const totalVotos = selectedVotacao.opcoes.reduce((acc, curr) => acc + parseInt(curr.votos_count || 0), 0);
                      const percentage = getPercentage(opcao.votos_count, totalVotos);
                      return (
                        <div key={opcao.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span style={{ color: 'var(--text-1)' }}>{opcao.descricao}</span>
                            <span style={{ color: 'var(--text-2)' }}>{opcao.votos_count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100" style={{ backgroundColor: 'var(--border)' }}>
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center mt-4" style={{ color: 'var(--text-3)' }}>
                    Total de votos recolhidos: {selectedVotacao.opcoes.reduce((acc, curr) => acc + parseInt(curr.votos_count || 0), 0)}
                  </p>
                </div>
              ) : (
                // Formulário de Voto
                <form onSubmit={handleVote} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                    <Vote size={18} className="text-blue-500" />
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Escolha a sua opção</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedVotacao.opcoes.map((opcao) => (
                      <label
                        key={opcao.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50/5 hover:border-blue-400 transition-all ${opcaoSelecionada === opcao.id ? 'border-blue-500 bg-blue-500/5 font-semibold' : 'border-slate-200'}`}
                        style={{ borderColor: opcaoSelecionada === opcao.id ? 'var(--blue-500)' : 'var(--border)' }}
                      >
                        <input
                          type="radio"
                          name="opcao_voto"
                          value={opcao.id}
                          checked={opcaoSelecionada === opcao.id}
                          onChange={(e) => setOpcaoSelecionada(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span style={{ color: 'var(--text-1)' }} className="text-sm">{opcao.descricao}</span>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="btn btn-primary w-full py-3">
                    Confirmar e Enviar Voto
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Vote size={48} className="opacity-40" />
              <p className="text-sm">Selecione uma sondagem na lista lateral para votar ou ver resultados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Votação */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Vote size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nova Votação</h3>
                  <p className="text-xs text-slate-500">Crie uma nova sondagem/consulta</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form id="form-create-votacao" onSubmit={handleCreateVotacao} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título da Sondagem</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ex: Aprovação do novo regulamento"
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Enquadramento</label>
                  <textarea
                    className="form-control h-20 resize-none"
                    placeholder="Explique o contexto desta votação..."
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Início</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={formData.data_inicio}
                      onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fim</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={formData.data_fim}
                      onChange={e => setFormData({ ...formData, data_fim: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="form-label">Opções de Resposta</label>
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Adicionar
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {formData.opcoes.map((opcao, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder={`Opção ${index + 1}`}
                          value={opcao}
                          onChange={e => handleOptionChange(index, e.target.value)}
                        />
                        {formData.opcoes.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOptionField(index)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-create-votacao" className="btn btn-primary">
                Criar Consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Votacoes;
