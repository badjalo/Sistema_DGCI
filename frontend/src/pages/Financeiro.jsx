import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const Financeiro = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0, divida: 0 });
  const [resumoMes, setResumoMes] = useState({ receitas: 0, despesas: 0, saldo: 0, divida: 0 });
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [pesquisa, setPesquisa] = useState('');
  const [categoriasLista, setCategoriasLista] = useState([]);

  const formatXOF = (val) => new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(val || 0);
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const fetchDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resumoRes, receitasRes, despesasRes] = await Promise.all([
        api.get('/financeiro/resumo', { params: { ano: anoSelecionado, mes: mesSelecionado } }),
        api.get('/financeiro/receitas', { params: { ano: anoSelecionado, mes: mesSelecionado, limit: 100 } }),
        api.get('/financeiro/despesas', { params: { ano: anoSelecionado, mes: mesSelecionado, limit: 100 } })
      ]);

      const receitas = receitasRes.data.data.map(r => ({ ...r, tipo: 'receita', data_movimento: r.data_receita, categoria_nome: r.categoria_nome || 'Quota' }));
      const despesas = despesasRes.data.data.map(d => ({ ...d, tipo: 'despesa', data_movimento: d.data_despesa, categoria_nome: d.categoria_nome || 'Geral' }));
      const combined = [...receitas, ...despesas].sort((a, b) => new Date(b.data_movimento) - new Date(a.data_movimento));
      setTransacoes(combined);

      const rec = parseFloat(resumoRes.data.data.total_receitas || 0);
      const des = parseFloat(resumoRes.data.data.total_despesas || 0);
      setResumo({
        receitas: rec,
        despesas: des,
        saldo: rec - des,
        divida: parseFloat(resumoRes.data.data.total_divida || 0)
      });
      setResumoMes({
        receitas: parseFloat(resumoRes.data.data.month_receitas || 0),
        despesas: parseFloat(resumoRes.data.data.month_despesas || 0),
        saldo: parseFloat(resumoRes.data.data.month_saldo || 0),
        divida: parseFloat(resumoRes.data.data.month_divida || 0)
      });
    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado, mesSelecionado]);

  useEffect(() => {
    fetchDados();
    api.get('/financeiro/categorias').then(res => setCategoriasLista(res.data.data || [])).catch(console.error);
  }, [fetchDados, filtro]);

  const mesAnterior = () => {
    if (mesSelecionado === 1) { setMesSelecionado(12); setAnoSelecionado(a => a - 1); }
    else { setMesSelecionado(m => m - 1); }
  };

  const mesSeguinte = () => {
    if (mesSelecionado === 12) { setMesSelecionado(1); setAnoSelecionado(a => a + 1); }
    else { setMesSelecionado(m => m + 1); }
  };

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'despesa',
    descricao: '',
    valor: '',
    categoria_id: '',
    metodo_pagamento: 'Dinheiro',
    data_movimento: new Date().toISOString().split('T')[0]
  });

  const handleNovoMovimento = async (e) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor) return toast.error('Preencha os campos obrigatórios');
    setIsSubmitting(true);
    try {
      const payload = {
        descricao: formData.descricao,
        valor: formData.valor,
        categoria_id: formData.categoria_id || undefined,
        metodo_pagamento: formData.metodo_pagamento,
        [formData.tipo === 'receita' ? 'data_receita' : 'data_despesa']: formData.data_movimento
      };
      await api.post(`/financeiro/${formData.tipo}s`, payload);
      toast.success('Movimento registado com sucesso!');
      setShowModal(false);
      setFormData({ tipo: 'despesa', descricao: '', valor: '', categoria_id: '', metodo_pagamento: 'Dinheiro', data_movimento: new Date().toISOString().split('T')[0] });
      fetchDados();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registar movimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const transacoesFiltradas = transacoes
    .filter(t => filtro === 'todas' || t.tipo === filtro)
    .filter(t =>
      (t.descricao?.toLowerCase().includes(pesquisa.toLowerCase())) ||
      (t.categoria_nome?.toLowerCase().includes(pesquisa.toLowerCase()))
    );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DollarSign}
        title="Controlo Financeiro"
        subtitle="Gestão de receitas, despesas e movimentos"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl px-2 py-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <button type="button" onClick={mesAnterior} className="p-1.5 rounded-lg transition-colors btn-icon" title="Mês anterior">
                <ChevronLeft size={18} />
              </button>
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))} className="select-inline">
                {monthNames.map((nome, i) => (<option key={i} value={i + 1}>{nome}</option>))}
              </select>
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))} className="select-inline">
                {[new Date().getFullYear() - 3, new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
              <button type="button" onClick={mesSeguinte} className="p-1.5 rounded-lg transition-colors btn-icon" title="Mês seguinte">
                <ChevronRight size={18} />
              </button>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={18} /> Novo Movimento
            </button>
          </div>
        }
      />

      {/* Summary Cards - Global (ano selecionado) */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}
        >
          Resumo Anual — {anoSelecionado}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Receitas</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumo.receitas).replace('XOF', '').trim()}</h3>
                <p className="text-xs font-semibold mt-2.5 flex items-center gap-1" style={{ color: 'var(--success)' }}>
                  <ArrowUpRight size={14} /> Total anual
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><ArrowUpRight size={20} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Despesas</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumo.despesas).replace('XOF', '').trim()}</h3>
                <p className="text-xs font-semibold mt-2.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                  <ArrowDownRight size={14} /> Total anual
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><ArrowDownRight size={20} /></div>
            </div>
          </div>

          <div className="card text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)', border: 'none' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent)' }} />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-85">Saldo</p>
                <h3 className="text-2xl font-extrabold mt-1.5">{formatXOF(resumo.saldo).replace('XOF', '').trim()}</h3>
                <p className="text-xs font-semibold mt-2.5 flex items-center gap-1 opacity-85">
                  <DollarSign size={14} /> Balanço anual
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl"><DollarSign size={20} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Dívida acumulada</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumo.divida).replace('XOF', '').trim()}</h3>
                <p className="text-xs font-semibold mt-2.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                  <AlertCircle size={14} /> Quotas pendentes
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><AlertCircle size={20} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}
        >
          Resumo Mensal — {monthNames[mesSelecionado - 1]} {anoSelecionado}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Receitas (Mês)</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumoMes.receitas).replace('XOF', '').trim()}</h3>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><ArrowUpRight size={18} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Despesas (Mês)</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumoMes.despesas).replace('XOF', '').trim()}</h3>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><ArrowDownRight size={18} /></div>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'var(--primary)', background: 'var(--primary-light)' }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Saldo (Mês)</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--primary)' }}>{formatXOF(resumoMes.saldo).replace('XOF', '').trim()}</h3>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(59,111,245,0.2)' }}><DollarSign size={18} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Dívida do mês</p>
                <h3 className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--text-1)' }}>{formatXOF(resumoMes.divida).replace('XOF', '').trim()}</h3>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><AlertCircle size={18} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Card */}
      <div className="card">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setFiltro('todas')} className={`btn text-sm ${filtro === 'todas' ? 'btn-primary' : 'btn-outline'}`}>Todos</button>
              <button onClick={() => setFiltro('receita')} className={`btn text-sm ${filtro === 'receita' ? 'btn-primary' : 'btn-outline'}`}>Receitas</button>
              <button onClick={() => setFiltro('despesa')} className={`btn text-sm ${filtro === 'despesa' ? 'btn-primary' : 'btn-outline'}`}>Despesas</button>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar descrição ou categoria..."
                className="form-control pl-12"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Método Pag.</th>
                  <th className="text-right">Valor</th>
                  <th className="text-center">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
                ) : transacoesFiltradas.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-3)' }}>Nenhum movimento encontrado para {monthNames[mesSelecionado - 1]} {anoSelecionado}.</td></tr>
                ) : (
                  transacoesFiltradas.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{new Date(t.data_movimento || t.criado_em).toLocaleDateString('pt-GW')}</td>
                      <td>{t.descricao}</td>
                      <td>{t.categoria_nome || 'Geral'}</td>
                      <td>{t.metodo_pagamento || 'N/D'}</td>
                      <td className="font-bold text-right">
                        <span className={t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                          {t.tipo === 'receita' ? '+' : '-'} {formatXOF(t.valor).replace('XOF', '').trim()}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${t.tipo === 'receita' ? 'badge-success' : 'badge-danger'}`}>
                          {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formData.tipo === 'receita' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {formData.tipo === 'receita'
                    ? <ArrowUpRight size={18} className="text-green-600" />
                    : <ArrowDownRight size={18} className="text-red-600" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Novo Movimento</h3>
                  <p className="text-xs text-slate-500">Registe uma receita ou despesa</p>
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
              <form id="form-financeiro" onSubmit={handleNovoMovimento} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Tipo de Movimento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo === 'receita' ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="tipo" value="receita" checked={formData.tipo === 'receita'} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="sr-only" />
                      <ArrowUpRight size={16} className="text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Receita (+)</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.tipo === 'despesa' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="tipo" value="despesa" checked={formData.tipo === 'despesa'} onChange={e => setFormData({ ...formData, tipo: e.target.value })} className="sr-only" />
                      <ArrowDownRight size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Despesa (-)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ex: Pagamento Fornecedor X"
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-control"
                      value={formData.categoria_id}
                      onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {categoriasLista.filter(c => c.tipo === formData.tipo).map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Método de Pagamento</label>
                    <select
                      className="form-control"
                      value={formData.metodo_pagamento}
                      onChange={e => setFormData({ ...formData, metodo_pagamento: e.target.value })}
                    >
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Valor (XOF)</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.valor}
                      onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={formData.data_movimento}
                      onChange={e => setFormData({ ...formData, data_movimento: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-financeiro" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A processar...' : 'Guardar Movimento'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Financeiro;
