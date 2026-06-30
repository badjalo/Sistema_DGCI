import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Vote, Plus, Calendar, CheckCircle2, BarChart2, Trash2, ToggleLeft, ToggleRight, Info, PlusCircle, X, Clock, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

// ─── COUNTDOWN HOOK ────────────────────────────────────────────────────────────
const useCountdown = (targetDate) => {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
    return {
      expired: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => { const id = setInterval(() => setTime(calc()), 60000); return () => clearInterval(id); }, [targetDate]);
  return time;
};

// ─── COUNTDOWN BADGE ──────────────────────────────────────────────────────────
const CountdownBadge = ({ dataFim }) => {
  const { expired, days, hours, minutes } = useCountdown(dataFim);
  if (expired) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
      <AlertTriangle size={9} /> Terminada
    </span>
  );
  const isUrgent = days === 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
      <Clock size={9} />
      {days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`}
    </span>
  );
};

// ─── RESULT BAR ──────────────────────────────────────────────────────────────
const ResultBar = ({ label, count, total, index }) => {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  const COLORS = ['#3b6ff5', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const color = COLORS[index % COLORS.length];
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{count} <span className="font-normal text-xs" style={{ color: 'var(--text-3)' }}>({pct}%)</span></span>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
    </div>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
const Votacoes = () => {
  const { user } = useAuth();
  const [votacoes, setVotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVotacao, setSelectedVotacao] = useState(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
  const [tab, setTab] = useState('ativas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '', descricao: '',
    data_inicio: new Date().toISOString().slice(0, 16),
    data_fim: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    opcoes: ['', ''],
  });

  const isAdmin = user?.perfil === 'administrador' || user?.perfil === 'secretario';

  const fetchVotacoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/votacoes');
      if (data.success) setVotacoes(data.data);
    } catch { toast.error('Erro ao carregar votações'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVotacoes(); }, [fetchVotacoes]);

  const loadDetalhe = async (id) => {
    try {
      const { data } = await api.get(`/votacoes/${id}`);
      if (data.success) { setSelectedVotacao(data.data); setOpcaoSelecionada(''); }
    } catch { toast.error('Erro ao obter detalhes'); }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!opcaoSelecionada) return toast.error('Selecione uma opção!');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/votacoes/${selectedVotacao.id}/votar`, { opcao_id: opcaoSelecionada });
      if (data.success) {
        toast.success(data.message || 'Voto registado!');
        await fetchVotacoes();
        await loadDetalhe(selectedVotacao.id);
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao votar'); }
    finally { setSubmitting(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanOpcoes = formData.opcoes.filter(o => o.trim());
    if (cleanOpcoes.length < 2) return toast.error('Adicione pelo menos 2 opções.');
    setSubmitting(true);
    try {
      const { data } = await api.post('/votacoes', { ...formData, opcoes: cleanOpcoes });
      if (data.success) {
        toast.success('Votação criada!');
        setShowCreateModal(false);
        setFormData({ titulo: '', descricao: '', data_inicio: new Date().toISOString().slice(0, 16), data_fim: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16), opcoes: ['', ''] });
        fetchVotacoes();
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao criar'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id, current) => {
    try {
      const { data } = await api.put(`/votacoes/${id}`, { ativa: !current });
      if (data.success) { toast.success(`Votação ${!current ? 'ativada' : 'desativada'}!`); fetchVotacoes(); if (selectedVotacao?.id === id) loadDetalhe(id); }
    } catch { toast.error('Erro ao alterar estado'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta votação? Ação irreversível.')) return;
    try {
      const { data } = await api.delete(`/votacoes/${id}`);
      if (data.success) { toast.success('Eliminada!'); setSelectedVotacao(null); fetchVotacoes(); }
    } catch { toast.error('Erro ao eliminar'); }
  };

  const agora = new Date();
  const ativas = votacoes.filter(v => v.ativa && new Date(v.data_fim) >= agora);
  const terminadas = votacoes.filter(v => !v.ativa || new Date(v.data_fim) < agora);
  const listaAtual = tab === 'ativas' ? ativas : tab === 'terminadas' ? terminadas : votacoes;

  const TABS = [
    { key: 'ativas', label: 'Ativas', count: ativas.length, color: '#10b981' },
    { key: 'terminadas', label: 'Terminadas', count: terminadas.length, color: '#94a3b8' },
    ...(isAdmin ? [{ key: 'admin', label: 'Gestão', count: votacoes.length, color: '#3b6ff5' }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Vote}
        title="Votações & Sondagens Online"
        subtitle="Participe de consultas democráticas e sondagens promovidas pela direção sindical"
        actions={isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} /> Criar Sondagem
          </button>
        )}
      />

      {/* ── Premium Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedVotacao(null); }}
            className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? t.color : 'var(--text-3)',
              boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t.label}
            <span
              className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: tab === t.key ? `${t.color}18` : 'var(--border)', color: tab === t.key ? t.color : 'var(--text-3)' }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Lista ── */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Selecione uma sondagem</p>
          {loading ? (
            <div className="flex justify-center py-10"><div className="spinner" /></div>
          ) : listaAtual.length === 0 ? (
            <div className="card text-center py-10 space-y-2">
              <Vote size={32} className="mx-auto opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhuma sondagem nesta secção.</p>
            </div>
          ) : (
            listaAtual.map(v => {
              const isSelected = selectedVotacao?.id === v.id;
              const isOver = new Date(v.data_fim) < agora;
              return (
                <div
                  key={v.id}
                  onClick={() => loadDetalhe(v.id)}
                  className="card cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: isSelected ? 'var(--primary)' : undefined,
                    boxShadow: isSelected ? '0 0 0 3px var(--primary-ring), var(--shadow-md)' : undefined,
                    borderLeft: `3px solid ${isOver ? '#94a3b8' : '#10b981'}`,
                  }}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{v.titulo}</h4>
                    {v.ja_votou && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                        <CheckCircle2 size={9} /> Votou
                      </span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-2)' }}>{v.descricao}</p>
                  <div className="flex items-center justify-between">
                    <CountdownBadge dataFim={v.data_fim} />
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>
                      <Users size={10} /> {v.total_votos || 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Detalhe / Voto ── */}
        <div className="lg:col-span-2">
          {selectedVotacao ? (
            <div className="card space-y-5">
              {/* Header da sondagem */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{selectedVotacao.titulo}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{selectedVotacao.descricao}</p>
                </div>
                {isAdmin && tab === 'admin' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(selectedVotacao.id, selectedVotacao.ativa)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      {selectedVotacao.ativa ? <ToggleRight size={22} style={{ color: 'var(--primary)' }} /> : <ToggleLeft size={22} style={{ color: 'var(--text-3)' }} />}
                    </button>
                    <button onClick={() => handleDelete(selectedVotacao.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  <Calendar size={12} /> Fim: {new Date(selectedVotacao.data_fim).toLocaleString('pt-PT')}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${selectedVotacao.ativa && new Date(selectedVotacao.data_fim) >= agora ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  <Info size={12} />
                  {selectedVotacao.ativa && new Date(selectedVotacao.data_fim) >= agora ? 'Ativa' : 'Terminada'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  <Users size={12} /> {selectedVotacao.opcoes?.reduce((a, o) => a + parseInt(o.votos_count || 0), 0)} votos
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)' }} />

              {/* Resultados ou Formulário */}
              {selectedVotacao.ja_votou || !selectedVotacao.ativa || new Date(selectedVotacao.data_fim) < agora ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
                    <h4 className="font-bold" style={{ color: 'var(--text-1)' }}>Resultados</h4>
                    {selectedVotacao.ja_votou && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                        <CheckCircle2 size={10} /> O seu voto foi contabilizado
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {selectedVotacao.opcoes.map((opcao, i) => {
                      const total = selectedVotacao.opcoes.reduce((a, o) => a + parseInt(o.votos_count || 0), 0);
                      return <ResultBar key={opcao.id} label={opcao.descricao} count={parseInt(opcao.votos_count || 0)} total={total} index={i} />;
                    })}
                  </div>
                  <p className="text-xs text-center pt-2" style={{ color: 'var(--text-3)' }}>
                    Total de votos: <strong>{selectedVotacao.opcoes.reduce((a, o) => a + parseInt(o.votos_count || 0), 0)}</strong>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVote} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Vote size={18} style={{ color: 'var(--primary)' }} />
                    <h4 className="font-bold" style={{ color: 'var(--text-1)' }}>Escolha a sua opção</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedVotacao.opcoes.map((opcao) => {
                      const selected = opcaoSelecionada === String(opcao.id);
                      return (
                        <label
                          key={opcao.id}
                          className="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200"
                          style={{
                            borderColor: selected ? 'var(--primary)' : 'var(--border)',
                            background: selected ? 'var(--primary-light)' : 'var(--surface)',
                          }}
                        >
                          <div
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                            style={{ borderColor: selected ? 'var(--primary)' : 'var(--border)', background: selected ? 'var(--primary)' : 'transparent' }}
                          >
                            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <input type="radio" name="opcao_voto" value={opcao.id} checked={selected} onChange={e => setOpcaoSelecionada(e.target.value)} className="sr-only" />
                          <span className="text-sm font-medium" style={{ color: selected ? 'var(--primary)' : 'var(--text-1)' }}>{opcao.descricao}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button type="submit" disabled={submitting || !opcaoSelecionada} className="btn btn-primary w-full py-3 text-base">
                    {submitting ? <><div className="spinner w-4 h-4" /> A submeter…</> : <><CheckCircle2 size={18} /> Confirmar e Enviar Voto</>}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                <Vote size={36} style={{ color: 'var(--primary)', opacity: 0.7 }} />
              </div>
              <div className="text-center">
                <p className="font-bold" style={{ color: 'var(--text-2)' }}>Nenhuma sondagem selecionada</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Clique num item da lista para votar ou ver resultados.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Criar ── */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card max-w-lg">
            {/* Modal header com gradiente */}
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', margin: '-1.5rem -1.5rem 1.5rem', padding: '1.25rem 1.5rem' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Vote size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nova Votação</h3>
                  <p className="text-xs text-white/70">Crie uma nova sondagem/consulta</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form id="form-create-votacao" onSubmit={handleCreate} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título da Sondagem</label>
                  <input type="text" required className="form-control" placeholder="Ex: Aprovação do novo regulamento"
                    value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição / Enquadramento</label>
                  <textarea className="form-control resize-none" rows={3} placeholder="Explique o contexto desta votação..."
                    value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Início</label>
                    <input type="datetime-local" required className="form-control" value={formData.data_inicio}
                      onChange={e => setFormData({ ...formData, data_inicio: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fim</label>
                    <input type="datetime-local" required className="form-control" value={formData.data_fim}
                      onChange={e => setFormData({ ...formData, data_fim: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label mb-0">Opções de Resposta</label>
                    <button type="button" onClick={() => setFormData({ ...formData, opcoes: [...formData.opcoes, ''] })}
                      className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                      style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                      <PlusCircle size={13} /> Adicionar
                    </button>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {formData.opcoes.map((opcao, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {idx + 1}
                        </span>
                        <input type="text" required className="form-control" placeholder={`Opção ${idx + 1}`}
                          value={opcao} onChange={e => { const o = [...formData.opcoes]; o[idx] = e.target.value; setFormData({ ...formData, opcoes: o }); }} />
                        {formData.opcoes.length > 2 && (
                          <button type="button" onClick={() => { const o = [...formData.opcoes]; o.splice(idx, 1); setFormData({ ...formData, opcoes: o }); }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                            <X size={15} />
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
              <button type="submit" form="form-create-votacao" disabled={submitting} className="btn btn-primary">
                {submitting ? 'A criar…' : <><Plus size={16} /> Criar Consulta</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Votacoes;
