import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Search, Filter, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MemberSearchInput from '../components/MemberSearchInput';

const Quotas = () => {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

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

  useEffect(() => {
    fetchQuotas();
  }, [ano, pagination.page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page !== 1) setPagination(prev => ({ ...prev, page: 1 }));
      else fetchQuotas();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

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
    referencia: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let val = 0;
    if (pagaQuota) val += 1000;
    if (pagaFundo) val += 4000;
    setFormData(prev => ({ ...prev, valor: String(val) }));
  }, [pagaQuota, pagaFundo]);

  const handlePagamento = async (e) => {
    e.preventDefault();

    // Validações
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
        referencia: formData.referencia || null,
        observacoes: formData.observacoes || null
      };

      console.log('Enviando pagamento:', dataToSend);
      const response = await api.post('/pagamentos', dataToSend);
      console.log('Resposta:', response.data);

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
        referencia: '',
        observacoes: ''
      });
      fetchQuotas();
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Response data:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in space-y-6 relative">
      <div className="page-title">
        <span />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={28} className="text-blue-600" />
            Quota e Fundo Social
          </h1>
          <p className="text-gray-500 text-sm mt-1">Lista de membros com estado mensal de quota e fundo social, meses pagos, meses em dívida e total de pagamento.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="form-control font-semibold bg-white"
        >
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>Ano {year}</option>;
          })}
        </select>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          Registar Pagamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <th className="sticky left-0 bg-gray-50 z-10 w-64 border-r">Membro</th>
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
                <tr><td colSpan={16} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={16} className="text-center py-8 text-gray-500">Nenhum membro encontrado.</td></tr>
              ) : (
                members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r py-3">
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

      {showModal && (
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
        </div>
      )}
    </div>
  );
};

export default Quotas;
