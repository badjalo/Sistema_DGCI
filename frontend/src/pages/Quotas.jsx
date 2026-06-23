import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { CreditCard, Search, Filter, XCircle, Plus, CheckSquare, Square, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MemberSearchInput from '../components/MemberSearchInput';
import PageHeader from '../components/PageHeader';

const Quotas = () => {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [bancos, setBancos] = useState([]);

  // Seleção em lote
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/quotas/situacao', {
        params: { ano, search, page: pagination.page, limit: pagination.limit }
      });
      setQuotas(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Erro ao carregar mapa de quotas');
    } finally {
      setLoading(false);
    }
  };

  const fetchBancos = async () => {
    try {
      const res = await api.get('/financeiro/bancos');
      if (res.data.success) {
        setBancos(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar bancos:', err);
    }
  };

  useEffect(() => {
    fetchQuotas();
    fetchBancos();
  }, [ano, pagination.page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) setPagination(prev => ({ ...prev, page: 1 }));
      else fetchQuotas();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Limpar seleção quando a lista mudar
  useEffect(() => {
    setSelectedMemberIds([]);
  }, [quotas]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMemberIds(quotas.map(m => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectMember = (id) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const members = quotas;
  const totalPagas = members.reduce((sum, membro) => sum + Number(membro.total_pago || 0), 0);
  const totalNaoPagas = members.reduce((sum, membro) => sum + Number(membro.total_divida || 0), 0);
  const totalDevedores = members.filter(m => Number(m.total_divida || 0) > 0).length;

  const getMonthStatus = (membro, monthNumber) => {
    const pagamentos = membro.pagamentos || [];
    const payment = pagamentos.find((p) => Number(p.mes) === monthNumber);
    const admissionDate = new Date(membro.data_admissao);
    const admissionYear = admissionDate.getFullYear();
    const admissionMonth = admissionDate.getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (ano < admissionYear) return 'ignore';
    if (ano === admissionYear && monthNumber < admissionMonth) return 'ignore';
    if (ano > currentYear) return 'future';
    if (ano === currentYear && monthNumber > currentMonth) return 'future';

    if (payment) {
      return payment.estado === 'pago' ? 'paid' : 'debt';
    }

    return 'debt';
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pagaQuota, setPagaQuota] = useState(true);
  const [pagaFundo, setPagaFundo] = useState(false);

  const [formData, setFormData] = useState({
    membro_id: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valor: '1000',
    metodo_pagamento: 'dinheiro',
    banco_id: '',
    referencia: '',
    observacoes: ''
  });

  const [batchFormData, setBatchFormData] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    metodo_pagamento: 'dinheiro',
    banco_id: '',
    referencia: '',
    observacoes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  useEffect(() => {
    let val = 0;
    if (pagaQuota) val += 1000;
    if (pagaFundo) val += 4000;
    setFormData(prev => ({ ...prev, valor: String(val) }));
  }, [pagaQuota, pagaFundo]);

  const handlePagamento = async (e) => {
    e.preventDefault();

    if (!formData.membro_id) {
      toast.error('Selecione um membro');
      return;
    }

    if (!pagaQuota && !pagaFundo) {
      toast.error('Selecione pelo menos um item a pagar (Quota ou Fundo Social)');
      return;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error('Valor deve ser maior que 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const rawValor = String(formData.valor).replace(/\s/g, '').replace(',', '.');
      const valor = Number(rawValor);

      if (!rawValor || isNaN(valor) || valor <= 0) {
        throw new Error('Valor inválido ou não preenchido');
      }

      const expectedValor = (pagaQuota ? 1000 : 0) + (pagaFundo ? 4000 : 0);
      if (valor !== expectedValor) {
        throw new Error(`O valor da quota para este membro deve ser ${expectedValor} XOF`);
      }

      const dataToSend = {
        membro_id: formData.membro_id,
        mes: parseInt(formData.mes),
        ano: parseInt(formData.ano),
        valor: valor,
        metodo_pagamento: formData.metodo_pagamento,
        banco_id: formData.banco_id ? parseInt(formData.banco_id) : null,
        referencia: formData.referencia || null,
        observacoes: formData.observacoes || null
      };

      await api.post('/pagamentos', dataToSend);
      toast.success('Pagamento registado com sucesso!');
      setShowModal(false);
      setSelectedMember(null);
      setPagaQuota(true);
      setPagaFundo(false);
      setFormData({
        membro_id: '',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor: '1000',
        metodo_pagamento: 'dinheiro',
        banco_id: '',
        referencia: '',
        observacoes: ''
      });
      fetchQuotas();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchPagamento = async (e) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      toast.error('Nenhum membro selecionado.');
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const res = await api.post('/pagamentos/lote', {
        membro_ids: selectedMemberIds,
        mes: parseInt(batchFormData.mes),
        ano: parseInt(batchFormData.ano),
        metodo_pagamento: batchFormData.metodo_pagamento,
        banco_id: batchFormData.banco_id ? parseInt(batchFormData.banco_id) : null,
        referencia: batchFormData.referencia || null,
        observacoes: batchFormData.observacoes || null
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Pagamento em massa registado!');
        setSelectedMemberIds([]);
        setShowBatchModal(false);
        fetchQuotas();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao processar pagamentos em lote.');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={CreditCard}
        title="Quota e Fundo Social"
        subtitle="Estado mensal de quota e fundo social — meses pagos, em dívida e total"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
              <Plus size={16} /> Registar Pagamento
            </button>
          </div>
        }
      />
      <div
        className="flex gap-2"
        style={{ animation: 'fadeUp 0.35s ease-out 0.1s both' }}
      >
        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="form-control font-semibold"
          style={{ maxWidth: '160px' }}
        >
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>Ano {year}</option>;
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <div className="card p-4" style={{ background: 'var(--success-bg)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="text-sm text-green-700 uppercase font-semibold tracking-wide">Total Pago (Quota + Fundo)</div>
          <div className="mt-3 text-3xl font-bold text-green-900">{new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(totalPagas)}</div>
          <div className="mt-2 text-sm text-green-700">Valor total pago no ano selecionado</div>
        </div>
        <div className="card p-4" style={{ background: 'var(--danger-bg)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="text-sm text-red-700 uppercase font-semibold tracking-wide">Total Dívida (Quota + Fundo)</div>
          <div className="mt-3 text-3xl font-bold text-red-900">{new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(totalNaoPagas)}</div>
          <div className="mt-2 text-sm text-red-700">Valor total de quota e fundo social em atraso</div>
        </div>
        <div className="card p-4" style={{ background: 'var(--yellow-bg)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
          <div className="text-sm text-yellow-700 uppercase font-semibold tracking-wide">Membros em atraso</div>
          <div className="mt-3 text-3xl font-bold text-yellow-900">{totalDevedores}</div>
          <div className="mt-2 text-sm text-yellow-700">Membros com valores em atraso</div>
        </div>
      </div>

      {/* Barra de Ações em Lote */}
      {selectedMemberIds.length > 0 && (
        <div className="card border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between gap-4 fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-blue-500" size={20} />
            <span className="text-sm font-bold text-blue-400">
              {selectedMemberIds.length} membros selecionados para registo em massa
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMemberIds([])}
              className="btn btn-secondary text-xs py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn btn-primary text-xs py-1.5 flex items-center gap-1.5"
            >
              <CreditCard size={14} />
              Registar Pagamento em Massa
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar membro..."
              className="form-control pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">✓</span>
            Pago
          </span>
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">✕</span>
            Em dívida
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-gray-400">—</span>
            Não conta
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Meses anteriores à data de admissão do membro não contam. Meses do futuro também ficam em branco; somente meses vencidos após a admissão são marcados como pago ou em dívida.
        </p>

        <div className="table-container overflow-x-auto">
          <table className="table min-w-[1200px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 z-20 w-12 text-center border-r">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.length === quotas.length && quotas.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="sticky left-12 bg-gray-50 z-10 w-64 border-r">Membro</th>
                {meses.map((mes) => (
                  <th key={mes} className="text-center w-16">{mes}</th>
                ))}
                <th className="text-right w-32">Meses Pagos</th>
                <th className="text-right w-36">Total Pago</th>
                <th className="text-right border-l w-36">Dívida (XOF)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={17} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={17} className="text-center py-8 text-gray-500">Nenhum membro encontrado.</td></tr>
              ) : (
                members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white z-20 text-center border-r py-3">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(m.id)}
                        onChange={() => handleSelectMember(m.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="sticky left-12 bg-white group-hover:bg-gray-50 z-10 border-r py-3">
                      <div className="font-semibold text-gray-900 truncate">{m.nome_completo}</div>
                      <div className="text-xs text-gray-500">{m.numero_membro}</div>
                    </td>
                    {meses.map((_, index) => {
                      const status = getMonthStatus(m, index + 1);
                      return (
                        <td key={index} className="text-center py-3">
                          {status === 'paid' ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">✓</span>
                          ) : status === 'debt' ? (
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">✕</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right py-3 text-gray-900 font-semibold">
                      {Number(m.meses_pagos || 0)}
                    </td>
                    <td className="text-right font-semibold text-green-700 py-3">
                      {new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(Number(m.total_pago || 0))}
                    </td>
                    <td className="text-right border-l font-bold text-red-600 py-3">
                      {new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(Number(m.total_divida || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pagamento Individual */}
      {showModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CreditCard size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Registar Pagamento</h3>
                  <p className="text-xs text-slate-500">Selecione o membro e os itens a pagar</p>
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
              <form id="form-pagamento" onSubmit={handlePagamento} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Membro</label>
                  <MemberSearchInput
                    value={formData.membro_id}
                    onChange={(membro_id, member) => {
                      setSelectedMember(member);
                      const hasFundo = member ? !!member.fundo_social : false;
                      setPagaQuota(true);
                      setPagaFundo(hasFundo);
                      setFormData(prev => ({ ...prev, membro_id }));
                    }}
                    placeholder="Pesquisar por nome ou número..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Mês</label>
                    <div className="form-control-select-wrapper">
                      <select required className="form-control" value={formData.mes} onChange={e => setFormData({ ...formData, mes: Number(e.target.value) })}>
                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ano</label>
                    <input type="number" required className="form-control" value={formData.ano} onChange={e => setFormData({ ...formData, ano: Number(e.target.value) })} />
                  </div>
                </div>

                {selectedMember && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens a Pagar</p>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <label className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <input
                          type="checkbox"
                          checked={pagaQuota}
                          onChange={(e) => setPagaQuota(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-slate-800">Quota Mensal</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">1.000 XOF</span>
                      </label>

                      <label className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                        selectedMember.fundo_social
                          ? 'bg-white border-slate-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50'
                          : 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50'
                      }`}>
                        <input
                          type="checkbox"
                          disabled={!selectedMember.fundo_social}
                          checked={pagaFundo}
                          onChange={(e) => setPagaFundo(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-slate-800">Fundo Social</span>
                          {!selectedMember.fundo_social && (
                            <span className="block text-xs text-slate-400">Membro não inscrito</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-purple-700">4.000 XOF</span>
                      </label>
                    </div>
                    <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Total a pagar</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {Number(formData.valor).toLocaleString('pt-PT')} XOF
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Método de Pagamento</label>
                  <div className="form-control-select-wrapper">
                    <select className="form-control" value={formData.metodo_pagamento} onChange={e => setFormData({ ...formData, metodo_pagamento: e.target.value })}>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="cheque">Cheque</option>
                      <option value="desconto_vencimento">Desconto no Vencimento</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Conta Bancária de Entrada</label>
                  <div className="form-control-select-wrapper">
                    <select className="form-control" value={formData.banco_id} onChange={e => setFormData({ ...formData, banco_id: e.target.value })}>
                      <option value="">Selecione um banco (opcional)</option>
                      {bancos.map(b => (
                        <option key={b.id} value={b.id}>{b.nome} - {b.numero_conta} ({new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(b.saldo_atual)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Referência (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nº de transferência ou cheque"
                    value={formData.referencia}
                    onChange={e => setFormData({ ...formData, referencia: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações (opcional)</label>
                  <textarea
                    className="form-control"
                    placeholder="Notas sobre este pagamento"
                    rows={2}
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-pagamento" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'A processar...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Pagamento em Massa (Lote) */}
      {showBatchModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pagamento em Massa</h3>
                  <p className="text-xs text-slate-500">Registar quotas/fundo para {selectedMemberIds.length} membros</p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Nota:</strong> O valor será calculado automaticamente por membro.
                Membros com <strong>Fundo Social</strong> ativo pagarão <strong>5.000 XOF</strong> (1.000 quota + 4.000 fundo).
                Os restantes pagarão <strong>1.000 XOF</strong> (apenas quota).
              </div>

              <form id="form-pagamento-lote" onSubmit={handleBatchPagamento} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Mês</label>
                    <div className="form-control-select-wrapper">
                      <select required className="form-control" value={batchFormData.mes} onChange={e => setBatchFormData({ ...batchFormData, mes: Number(e.target.value) })}>
                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ano</label>
                    <input type="number" required className="form-control" value={batchFormData.ano} onChange={e => setBatchFormData({ ...batchFormData, ano: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pagamento</label>
                  <div className="form-control-select-wrapper">
                    <select className="form-control" value={batchFormData.metodo_pagamento} onChange={e => setBatchFormData({ ...batchFormData, metodo_pagamento: e.target.value })}>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="cheque">Cheque</option>
                      <option value="desconto_vencimento">Desconto no Vencimento</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Conta Bancária de Entrada</label>
                  <div className="form-control-select-wrapper">
                    <select className="form-control" value={batchFormData.banco_id} onChange={e => setBatchFormData({ ...batchFormData, banco_id: e.target.value })}>
                      <option value="">Selecione um banco (opcional)</option>
                      {bancos.map(b => (
                        <option key={b.id} value={b.id}>{b.nome} - {b.numero_conta} ({new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(b.saldo_atual)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Referência (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nº de transferência ou cheque"
                    value={batchFormData.referencia}
                    onChange={e => setBatchFormData({ ...batchFormData, referencia: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações (opcional)</label>
                  <textarea
                    className="form-control"
                    placeholder="Notas comuns sobre estes pagamentos"
                    rows={2}
                    value={batchFormData.observacoes}
                    onChange={e => setBatchFormData({ ...batchFormData, observacoes: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowBatchModal(false)} className="btn btn-outline">Cancelar</button>
              <button type="submit" form="form-pagamento-lote" disabled={isBatchSubmitting} className="btn btn-primary">
                {isBatchSubmitting ? 'A processar lote...' : `Processar ${selectedMemberIds.length} Pagamentos`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Quotas;
