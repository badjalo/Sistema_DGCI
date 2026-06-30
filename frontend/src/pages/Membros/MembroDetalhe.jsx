import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, Edit2, FileText, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const MembroDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pessoais');
  const [loadingDeclaracao, setLoadingDeclaracao] = useState(false);
  const [pagamentos, setPagamentos] = useState([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchMembro = async () => {
      try {
        const { data } = await api.get(`/membros/${id}`);
        setMembro(data.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do membro');
      } finally {
        setLoading(false);
      }
    };
    fetchMembro();
  }, [id]);

  const fetchPagamentos = useCallback(async (ano) => {
    setLoadingPagamentos(true);
    try {
      const { data } = await api.get(`/membros/${id}/pagamentos?ano=${ano}`);
      setPagamentos(data.data);
    } catch {
      toast.error('Erro ao carregar histórico de quotas');
    } finally {
      setLoadingPagamentos(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'quotas') fetchPagamentos(anoSelecionado);
  }, [activeTab, anoSelecionado, fetchPagamentos]);

  const handleVerCartao = () => {
    navigate(`/membros/${id}/cartao`);
  };

  const handleEditarPerfil = () => {
    navigate(`/membros/${id}/editar`);
  };

  const handleDownloadDeclaracao = async () => {
    setLoadingDeclaracao(true);
    try {
      const response = await api.get(`/membros/${id}/declaracao`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `declaracao_${membro?.numero_membro || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Declaração exportada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar declaração');
    } finally {
      setLoadingDeclaracao(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
  if (!membro) return <div className="text-center p-12 text-gray-500">Membro não encontrado.</div>;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/membros" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2043]">{membro.nome_completo}</h1>
            <p className="text-gray-500 text-sm">{membro.numero_membro}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadDeclaracao}
            disabled={loadingDeclaracao}
            className="btn btn-outline gap-2"
            title="Exportar Declaração de Filiação em PDF"
          >
            {loadingDeclaracao ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            Declaração
          </button>
          <button onClick={handleVerCartao} className="btn btn-outline gap-2">
            <CreditCard size={18} /> Cartão
          </button>
          <button onClick={handleEditarPerfil} className="btn btn-primary gap-2">
            <Edit2 size={18} /> Editar
          </button>
        </div>
      </div>

      {/* Card Principal do Membro */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold shadow-sm relative flex-shrink-0">
              {membro.foto_url ? (
                <img src={membro.foto_url} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                membro.nome_completo.charAt(0).toUpperCase()
              )}
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${membro.estado === 'ativo' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
            </div>
          </div>

          {/* Info Principal */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cargo / Função</p>
                <p className="font-medium text-gray-900 mt-1">{membro.cargo_nome || membro.funcao_cargo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Departamento</p>
                <p className="font-medium text-gray-900 mt-1">{membro.departamento_nome || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fundo Social</p>
                <span className={`badge mt-1 ${membro.fundo_social ? 'badge-success bg-purple-100 text-purple-700 border-purple-200' : 'badge-neutral bg-slate-100 text-slate-500'}`}>
                  {membro.fundo_social ? 'Inscrito' : 'Não Inscrito'}
                </span>
              </div>
              <div className="flex sm:block justify-center items-center">
                <span className={`badge ${membro.estado === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                  {membro.estado.charAt(0).toUpperCase() + membro.estado.slice(1)}
                </span>
              </div>
            </div>

            {/* Contactos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{membro.telefone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start min-w-0">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{membro.email || 'Sem email'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{membro.morada || 'Sem morada'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('pessoais')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'pessoais'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('profissionais')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'profissionais'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Dados Profissionais
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'quotas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Quotas ({membro.total_quotas_pagas || 0})
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="p-6">
          {/* Dados Pessoais */}
          {activeTab === 'pessoais' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sexo</p>
                <p className="font-medium text-gray-900 mt-2 capitalize">{membro.sexo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data de Nascimento</p>
                <p className="font-medium text-gray-900 mt-2">
                  {new Date(membro.data_nascimento).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado Civil</p>
                <p className="font-medium text-gray-900 mt-2 capitalize">{membro.estado_civil?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">NIF</p>
                <p className="font-medium text-gray-900 mt-2">{membro.nif || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">BI / Passaporte</p>
                <p className="font-medium text-gray-900 mt-2">{membro.bi_passaporte}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Telefone</p>
                <p className="font-medium text-gray-900 mt-2">{membro.telefone || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="font-medium text-gray-900 mt-2">{membro.email || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Morada</p>
                <p className="font-medium text-gray-900 mt-2">{membro.morada || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Dados Profissionais */}
          {activeTab === 'profissionais' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-12 sm:gap-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Departamento</p>
                <p className="font-medium text-gray-900 mt-2">{membro.departamento_nome || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cargo / Função</p>
                <p className="font-medium text-gray-900 mt-2">{membro.cargo_nome || membro.funcao_cargo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data de Admissão</p>
                <p className="font-medium text-gray-900 mt-2">
                  {new Date(membro.data_admissao).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</p>
                <p className="font-medium text-gray-900 mt-2 capitalize">{membro.estado}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fundo Social</p>
                <p className="font-medium text-gray-900 mt-2">
                  {membro.fundo_social ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Inscrito(a)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Não Inscrito(a)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Quotas */}
          {activeTab === 'quotas' && (
            <div className="space-y-5">
              {/* KPI resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border" style={{ background: 'var(--success-bg)', borderColor: 'rgba(16,185,129,0.25)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Pagas</p>
                  <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--success)' }}>{membro.total_quotas_pagas || 0}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>meses este ano</p>
                </div>
                <div className="p-4 rounded-xl border" style={{ background: 'var(--danger-bg)', borderColor: 'rgba(239,68,68,0.25)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Em Atraso</p>
                  <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--danger)' }}>{membro.total_quotas_divida || 0}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>meses em dívida</p>
                </div>
                <div className="p-4 rounded-xl border col-span-2 sm:col-span-1" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Total Pago</p>
                  <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--text-1)' }}>
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(
                      pagamentos.filter(p => p.estado === 'pago').reduce((s, p) => s + Number(p.valor || 0), 0)
                    )}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>acumulado {anoSelecionado}</p>
                </div>
              </div>

              {/* Seletor de ano */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Histórico Mês-a-Mês</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setAnoSelecionado(a => a - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-2)' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 text-sm font-bold rounded-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {anoSelecionado}
                  </span>
                  <button onClick={() => setAnoSelecionado(a => a + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-2)' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Tabela de histórico */}
              {loadingPagamentos ? (
                <div className="flex justify-center py-10"><div className="spinner" /></div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th>Estado</th>
                        <th>Valor</th>
                        <th>Data Pagamento</th>
                        <th>Registado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((nomeMes, idx) => {
                        const mes = idx + 1;
                        const pag = pagamentos.find(p => Number(p.mes) === mes);
                        const isPago = pag?.estado === 'pago';
                        const isPendente = pag?.estado === 'pendente';
                        return (
                          <tr key={mes}>
                            <td className="font-medium">{nomeMes}</td>
                            <td>
                              {pag ? (
                                <span className={`badge ${
                                  isPago ? 'badge-success' : isPendente ? 'badge-warning' : 'badge-danger'
                                } flex items-center gap-1.5 w-fit`}>
                                  {isPago ? <CheckCircle2 size={12} /> : isPendente ? <Clock size={12} /> : <XCircle size={12} />}
                                  {pag.estado.charAt(0).toUpperCase() + pag.estado.slice(1)}
                                </span>
                              ) : (
                                <span className="badge badge-neutral flex items-center gap-1.5 w-fit">
                                  <XCircle size={12} /> Sem registo
                                </span>
                              )}
                            </td>
                            <td className="font-medium">
                              {pag?.valor ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(pag.valor) : '—'}
                            </td>
                            <td style={{ color: 'var(--text-3)' }}>
                              {pag?.data_pagamento ? new Date(pag.data_pagamento).toLocaleDateString('pt-PT') : '—'}
                            </td>
                            <td style={{ color: 'var(--text-3)' }}>{pag?.registado_por_nome || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembroDetalhe;
