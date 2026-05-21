import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Search, Filter, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  const getStatusIcon = (pagamentos, mesIndex, anoSelecionado) => {
    const mes = mesIndex + 1;
    const pag = pagamentos?.find(p => p.mes === mes);
    if (pag) {
      if (pag.estado === 'pago') return <CheckCircle2 size={18} className="text-green-500 mx-auto" title="Pago" />;
      if (pag.estado === 'pendente' || pag.estado === 'atrasado') return <AlertCircle size={18} className="text-red-500 mx-auto" title="Em dívida" />;
      return <XCircle size={18} className="text-gray-400 mx-auto" title="Estado desconhecido" />;
    }

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const isMesPassado = anoSelecionado < anoAtual || (anoSelecionado === anoAtual && mes < mesAtual);

    if (isMesPassado) {
      return <AlertCircle size={18} className="text-red-500 mx-auto" title="Em dívida" />;
    }

    return <div className="w-4 h-4 rounded-full bg-gray-200 mx-auto" title="Não lançado"></div>;
  };

  const totalPagas = quotas.reduce((sum, membro) => sum + Number(membro.total_pago || 0), 0);
  const totalNaoPagas = quotas.reduce((sum, membro) => sum + Number(membro.total_divida || 0), 0);

  // Estado do Modal de Pagamento
  const [showModal, setShowModal] = useState(false);
  const [membrosList, setMembrosList] = useState([]);
  const [formData, setFormData] = useState({
    membro_id: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    valor: 1000,
    metodo_pagamento: 'dinheiro',
    referencia: '',
    observacoes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar lista de membros ao abrir o modal
  useEffect(() => {
    if (showModal && membrosList.length === 0) {
      api.get('/membros?limit=1000').then(res => setMembrosList(res.data.data)).catch(console.error);
    }
  }, [showModal]);

  const handlePagamento = async (e) => {
    e.preventDefault();
    if (!formData.membro_id) return toast.error('Selecione um membro');
    setIsSubmitting(true);
    try {
      await api.post('/quotas/pagamentos', formData);
      toast.success('Pagamento registado com sucesso!');
      setShowModal(false);
      fetchQuotas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registar pagamento');
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
            Mapa de Quotas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestão e controlo de pagamentos de quotas mensais</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4" style={{ background: 'var(--success-bg)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="text-sm text-green-700 uppercase font-semibold tracking-wide">Total quotas pagas</div>
          <div className="mt-3 text-3xl font-bold text-green-900">{new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(totalPagas)}</div>
          <div className="mt-2 text-sm text-green-700">Valor total pago no ano selecionado</div>
        </div>
        <div className="card p-4" style={{ background: 'var(--danger-bg)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="text-sm text-red-700 uppercase font-semibold tracking-wide">Total quotas não pagas</div>
          <div className="mt-3 text-3xl font-bold text-red-900">{new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(totalNaoPagas)}</div>
          <div className="mt-2 text-sm text-red-700">Valor total em dívida no ano selecionado</div>
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
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-green-500" /> Pago</span>
            <span className="flex items-center gap-1"><AlertCircle size={16} className="text-red-500" /> Em Dívida</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-200"></div> Não Lançado</span>
          </div>
        </div>

        <div className="table-container overflow-x-auto">
          <table className="table min-w-[1000px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 w-64 border-r">Membro</th>
                {meses.map(mes => <th key={mes} className="text-center w-12">{mes}</th>)}
                <th className="text-right border-l w-32">Dívida (XOF)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
              ) : quotas.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-gray-500">Nenhum membro encontrado.</td></tr>
              ) : (
                quotas.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r py-3">
                      <div className="font-semibold text-gray-900 truncate">{m.nome_completo}</div>
                      <div className="text-xs text-gray-500">{m.numero_membro}</div>
                    </td>
                    {meses.map((_, i) => (
                      <td key={i} className="text-center py-3">
                        {getStatusIcon(m.pagamentos, i, ano)}
                      </td>
                    ))}
                    <td className="text-right border-l font-bold text-red-600 py-3">
                      {m.total_divida > 0 ? new Intl.NumberFormat('pt-GW').format(m.total_divida) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registar Pagamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
          <div className="card w-full max-w-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Registar Pagamento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handlePagamento} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Membro</label>
                <div className="form-control-select-wrapper">
                  <select required className="form-control" value={formData.membro_id} onChange={e => setFormData({ ...formData, membro_id: e.target.value })}>
                    <option value="">Selecione o membro...</option>
                    {membrosList.map(m => <option key={m.id} value={m.id}>{m.nome_completo} ({m.numero_membro})</option>)}
                  </select>
                </div>
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

              <div className="form-group">
                <label className="form-label">Valor (XOF)</label>
                <input type="number" required className="form-control" value={formData.valor} onChange={e => setFormData({ ...formData, valor: Number(e.target.value) })} />
              </div>

              <div className="form-group">
                <label className="form-label">Método</label>
                <div className="form-control-select-wrapper">
                  <select className="form-control" value={formData.metodo_pagamento} onChange={e => setFormData({ ...formData, metodo_pagamento: e.target.value })}>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="cheque">Cheque</option>
                    <option value="desconto_vencimento">Desconto no Vencimento</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-8 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                  {isSubmitting ? 'A processar...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotas;
