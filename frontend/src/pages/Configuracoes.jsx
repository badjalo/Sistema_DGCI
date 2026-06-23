import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';

const Configuracoes = () => {
  const [configs, setConfigs] = useState({
    nome_sindicato: '',
    sigla: '',
    sede: '',
    telefone: '',
    email: '',
    website: '',
    quota_mensal: ''
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data } = await api.get('/configuracoes');
        setConfigs(data.data);
      } catch (error) {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/utilizadores');
        setUsers(data.data);
      } catch (error) {
        toast.error('Erro ao carregar utilizadores');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchConfigs();
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/configuracoes', configs);
      toast.success('Configurações guardadas com sucesso');
    } catch (error) {
      toast.error('Erro ao guardar configurações');
    }
  };

  const handleChange = (e) => {
    setConfigs({ ...configs, [e.target.name]: e.target.value });
  };

  const [activeTab, setActiveTab] = useState('geral');
  const [perfilForm, setPerfilForm] = useState({ nome: '', email: '', password: '' });
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', perfil: 'operador' });
  const [creatingUser, setCreatingUser] = useState(false);

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast.error('Preencha nome, email e password');
      return;
    }

    setCreatingUser(true);
    try {
      await api.post('/utilizadores', newUser);
      toast.success('Utilizador criado com sucesso');
      setShowUserModal(false);
      setNewUser({ nome: '', email: '', password: '', perfil: 'operador' });
      setUsersLoading(true);
      const { data } = await api.get('/utilizadores');
      setUsers(data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar utilizador');
    } finally {
      setCreatingUser(false);
      setUsersLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0f2043]">Configurações do Sistema</h1>
      <p className="text-gray-500 text-sm mt-1 mb-6">Gerir preferências e parâmetros do sistema</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg transition-colors ${activeTab === 'geral' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
        >
          Geral
        </button>
        <button 
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg transition-colors ${activeTab === 'perfil' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
        >
          Perfil
        </button>
        <button 
          onClick={() => setActiveTab('permissoes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg transition-colors ${activeTab === 'permissoes' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
        >
          Permissões
        </button>
      </div>

      <div className="card">
        {activeTab === 'geral' && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Configurações do Sindicato</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Nome do Sindicato</label>
                <input 
                  type="text" name="nome_sindicato" value={configs.nome_sindicato || ''} onChange={handleChange}
                  className="form-control" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Sigla</label>
                <input 
                  type="text" name="sigla" value={configs.sigla || ''} onChange={handleChange}
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Sede</label>
                <input 
                  type="text" name="sede" value={configs.sede || ''} onChange={handleChange}
                  className="form-control" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label text-xs uppercase tracking-wider text-gray-500">Telefone</label>
                  <input 
                    type="text" name="telefone" value={configs.telefone || ''} onChange={handleChange}
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs uppercase tracking-wider text-gray-500">Email</label>
                  <input 
                    type="email" name="email" value={configs.email || ''} onChange={handleChange}
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Valor Mensal da Quota (XOF)</label>
                <input 
                  type="number" name="quota_mensal" value={configs.quota_mensal || ''} onChange={handleChange}
                  className="form-control max-w-xs" 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  Guardar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-6">O Meu Perfil</h3>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Perfil atualizado com sucesso!'); }} className="space-y-6 max-w-md">
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Nome</label>
                <input type="text" className="form-control" defaultValue="Administrador SF-DGCI" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Email</label>
                <input type="email" className="form-control" defaultValue="admin@sf-dgci.gw" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Nova Password</label>
                <input type="password" className="form-control" placeholder="Deixe em branco para manter a atual" />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-start">
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> Atualizar Perfil
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'permissoes' && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Cargos e Permissões</h3>
              <button
                type="button"
                onClick={() => setShowUserModal(true)}
                className="btn btn-primary text-sm py-1.5 px-3"
              >
                Adicionar Utilizador
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Utilizador</th>
                    <th>Email</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <div className="spinner mx-auto"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">Nenhum utilizador encontrado.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="font-semibold">{user.nome}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.perfil === 'administrador' ? 'badge-danger' : user.perfil === 'tesoureiro' ? 'badge-info' : user.perfil === 'secretario' ? 'badge-warning' : user.perfil === 'auditor' ? 'badge-secondary' : 'badge-neutral'}`}>
                            {user.perfil}</span>
                        </td>
                        <td>
                          <span className={`badge ${user.ativo ? 'badge-success' : 'badge-danger'}`}>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2">
              <span className="font-bold">Nota:</span> 
              A gestão detalhada de ACL (Access Control Lists) está em fase de implementação na v2.
            </div>

            {showUserModal && createPortal(
              <div className="modal-backdrop">
                <div className="modal-card max-w-md">
                  <div className="modal-header">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">U+</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Adicionar Utilizador</h3>
                        <p className="text-xs text-slate-500">Crie um novo acesso ao sistema</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-xl leading-none">&times;</span>
                    </button>
                  </div>

                  <div className="modal-body">
                    <form id="form-utilizador" onSubmit={handleCreateUser} className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Nome Completo</label>
                        <input
                          type="text"
                          name="nome"
                          value={newUser.nome}
                          onChange={handleNewUserChange}
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={newUser.email}
                          onChange={handleNewUserChange}
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={newUser.password}
                          onChange={handleNewUserChange}
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Perfil</label>
                        <div className="form-control-select-wrapper">
                          <select
                            name="perfil"
                            value={newUser.perfil}
                            onChange={handleNewUserChange}
                            className="form-control"
                          >
                            <option value="administrador">Administrador</option>
                            <option value="presidente">Presidente</option>
                            <option value="tesoureiro">Tesoureiro</option>
                            <option value="secretario">Secretário</option>
                            <option value="operador">Operador</option>
                            <option value="auditor">Auditor</option>
                          </select>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="btn btn-outline"
                    >
                      Cancelar
                    </button>
                    <button type="submit" form="form-utilizador" disabled={creatingUser} className="btn btn-primary">
                      {creatingUser ? 'A criar...' : 'Criar Utilizador'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Configuracoes;
