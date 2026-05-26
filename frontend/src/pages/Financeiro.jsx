import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Search, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Financeiro = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0, divida: 0 });
  const [resumoMes, setResumoMes] = useState({ receitas: 0, despesas: 0, saldo: 0, divida: 0 });
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [pesquisa, setPesquisa] = useState('');

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
        [formData.tipo === 'receita' ? 'data_receita' : 'data_despesa']: formData.data_movimento
      };
      await api.post(`/financeiro/${formData.tipo}s`, payload);
      toast.success('Movimento registado com sucesso!');
      setShowModal(false);
      setFormData({ tipo: 'despesa', descricao: '', valor: '', data_movimento: new Date().toISOString().split('T')[0] });
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
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Controlo Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Gestão de receitas, despesas e movimentos</p>
        </div>

        {/* Year/Month Navigator — prominently in header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-xl px-2 py-1.5">
            <button
              type="button"
              onClick={mesAnterior}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(Number(e.target.value))}
              className="select-inline"
            >
              {monthNames.map((nome, i) => (
                <option key={i} value={i + 1}>{nome}</option>
              ))}
            </select>

            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="select-inline"
            >
              {[new Date().getFullYear() - 3, new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={mesSeguinte}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Mês seguinte"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Movimento
          </button>
        </div>
      </div>

      {/* Summary Cards - Global (ano selecionado) */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo Anual — {anoSelecionado}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receitas</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumo.receitas).replace('XOF', '').trim()}</h3>
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  <ArrowUpRight size={14} /> Total anual
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-green-600"><ArrowUpRight size={20} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Despesas</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumo.despesas).replace('XOF', '').trim()}</h3>
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                  <ArrowDownRight size={14} /> Total anual
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg text-red-600"><ArrowDownRight size={20} /></div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Saldo</p>
                <h3 className="text-2xl font-bold text-white">{formatXOF(resumo.saldo).replace('XOF', '').trim()}</h3>
                <p className="text-xs opacity-80 font-medium mt-2 flex items-center gap-1">
                  <DollarSign size={14} /> Balanço anual
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg"><DollarSign size={20} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dívida acumulada</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumo.divida).replace('XOF', '').trim()}</h3>
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Dívida total de quotas pendentes
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg text-red-600"><AlertCircle size={20} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Resumo Mensal — {monthNames[mesSelecionado - 1]} {anoSelecionado}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receitas (Mês)</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumoMes.receitas).replace('XOF', '').trim()}</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg text-green-600"><ArrowUpRight size={18} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Despesas (Mês)</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumoMes.despesas).replace('XOF', '').trim()}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-lg text-red-600"><ArrowDownRight size={18} /></div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Saldo (Mês)</p>
                <h3 className="text-2xl font-bold text-blue-900">{formatXOF(resumoMes.saldo).replace('XOF', '').trim()}</h3>
              </div>
              <div className="bg-blue-200 p-2 rounded-lg text-blue-600"><DollarSign size={18} /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dívida do mês</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatXOF(resumoMes.divida).replace('XOF', '').trim()}</h3>
                <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Dívida apenas para o mês selecionado
                </p>
              </div>
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertCircle size={18} /></div>
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
          <div className="overflow-x-auto -mx-6 border-t border-slate-200 pt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Descrição</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Categoria</th>
                  <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Documento</th>
                  <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Valor</th>
                  <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
                ) : transacoesFiltradas.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nenhum movimento encontrado para {monthNames[mesSelecionado - 1]} {anoSelecionado}.</td></tr>
                ) : (
                  transacoesFiltradas.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-6 py-3 text-sm text-slate-900 font-medium">{new Date(t.data_movimento || t.criado_em).toLocaleDateString('pt-GW')}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{t.descricao}</td>
                      <td className="px-6 py-3 text-sm"><span className="text-slate-600">{t.categoria_nome || 'Geral'}</span></td>
                      <td className="px-6 py-3 text-sm">
                        {t.documento_referencia
                          ? <span className="flex items-center gap-1 text-blue-600 cursor-pointer hover:text-blue-700"><FileText size={14} /> {t.documento_referencia}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-right">
                        <span className={t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                          {t.tipo === 'receita' ? '+' : '-'} {formatXOF(t.valor).replace('XOF', '').trim()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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

      {showModal && (
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
        </div>
      )}
    </div>
  );
};

export default Financeiro;
