import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, Download, Edit2 } from 'lucide-react';

const MembroDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pessoais');

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

  const handleVerCartao = async () => {
    try {
      const response = await api.get(`/membros/${id}/cartao`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/pdf'
        }
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartao_${membro.numero_membro}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Cartão descarregado com sucesso!');
    } catch (error) {
      console.error('Erro ao descarregar cartão:', error);
      toast.error(error.response?.data?.error || 'Erro ao descarregar cartão');
    }
  };

  const handleEditarPerfil = () => {
    navigate(`/membros/${id}/editar`);
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
          <button onClick={handleVerCartao} className="btn btn-outline gap-2">
            <CreditCard size={18} /> Cartão
          </button>
          <button onClick={handleEditarPerfil} className="btn btn-primary gap-2">
            <Edit2 size={18} /> Editar
          </button>
        </div>
      </div>

      {/* Card Principal do Membro */}
      <div className="card card-member">
        <div className="flex gap-6">
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
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-8">
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
              <div>
                <span className={`badge ${membro.estado === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                  {membro.estado.charAt(0).toUpperCase() + membro.estado.slice(1)}
                </span>
              </div>
            </div>

            {/* Contactos */}
            <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{membro.telefone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm truncate">{membro.email || 'Sem email'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{membro.morada || 'Sem morada'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pessoais')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'pessoais'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('profissionais')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'profissionais'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Dados Profissionais
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'quotas'
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
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
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
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="font-medium text-gray-900 mt-2">{membro.email || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Morada</p>
                <p className="font-medium text-gray-900 mt-2">{membro.morada || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Dados Profissionais */}
          {activeTab === 'profissionais' && (
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
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
              <div>
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
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm font-semibold text-green-700">Quotas Pagas</p>
                <h3 className="text-3xl font-bold text-green-800 mt-2">{membro.total_quotas_pagas || 0}</h3>
                <p className="text-xs text-green-600 mt-1">meses pagos este ano</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm font-semibold text-red-700">Quotas em Atraso</p>
                <h3 className="text-3xl font-bold text-red-800 mt-2">{membro.total_quotas_divida || 0}</h3>
                <p className="text-xs text-red-600 mt-1">meses em dívida</p>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-800"><b>Meses pendentes:</b> {membro.meses_em_divida || 'Nenhum'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembroDetalhe;
