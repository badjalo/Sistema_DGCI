import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Search, Edit, Trash2, KeyRound,
  CheckCircle, XCircle, Shield, RefreshCw, X, ShieldAlert, Mail, User, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PERFIS = [
  { value: 'administrador', label: 'Administrador',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { value: 'presidente',    label: 'Presidente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { value: 'secretario',    label: 'Secretário',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { value: 'tesoureiro',    label: 'Tesoureiro',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { value: 'operador',      label: 'Operador',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { value: 'auditor',       label: 'Auditor',        color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  { value: 'membro',        label: 'Membro',         color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
];

const getPerfilBadge = (perfil) => {
  const found = PERFIS.find(p => p.value === perfil);
  if (!found) return { label: perfil, color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
  return found;
};

const Utilizadores = () => {
  const { user: currentUser } = useAuth();
  const [utilizadores, setUtilizadores] = useState([]);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('operador');
  const [membroId, setMembroId] = useState('');
  const [password, setPassword] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Password Reset state
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUtilizadores();
    fetchMembros();
  }, []);

  const fetchUtilizadores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/utilizadores');
      if (res.data.success) {
        setUtilizadores(res.data.data);
      }
    } catch (err) {
      toast.error('Erro ao carregar utilizadores.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembros = async () => {
    try {
      const res = await api.get('/membros');
      if (res.data.success) {
        setMembros(res.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar membros para associação:', err);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setNome('');
    setEmail('');
    setPerfil('operador');
    setMembroId('');
    setPassword('');
    setAtivo(true);
    setShowFormModal(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setNome(u.nome);
    setEmail(u.email);
    setPerfil(u.perfil);
    setMembroId(u.membro_id || '');
    setAtivo(u.ativo);
    setShowFormModal(true);
  };

  const handleOpenPassword = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !email || (!selectedUser && !password)) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      if (selectedUser) {
        // Editar
        await api.put(`/utilizadores/${selectedUser.id}`, {
          nome, email, perfil, ativo, membro_id: membroId || null
        });
        toast.success('Utilizador atualizado com sucesso.');
      } else {
        // Criar
        await api.post('/utilizadores', {
          nome, email, password, perfil, membro_id: membroId || null
        });
        toast.success('Utilizador criado com sucesso.');
      }
      setShowFormModal(false);
      fetchUtilizadores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao guardar utilizador.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    try {
      await api.put(`/utilizadores/${selectedUser.id}/reset-password`, {
        new_password: newPassword
      });
      toast.success('Palavra-passe alterada com sucesso.');
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao alterar palavra-passe.');
    }
  };

  const handleToggleAtivo = async (u) => {
    if (u.id === currentUser.id) {
      toast.error('Não pode desativar a sua própria conta.');
      return;
    }
    try {
      await api.put(`/utilizadores/${u.id}`, { ativo: !u.ativo });
      toast.success(`Utilizador ${!u.ativo ? 'ativado' : 'desativado'} com sucesso.`);
      fetchUtilizadores();
    } catch (err) {
      toast.error('Erro ao alterar estado do utilizador.');
    }
  };

  const handleProvisionarMembros = async () => {
    if (!window.confirm('Criar contas de acesso para todos os membros com email cadastrado?\n\nSenha padrão: sf-dgci123*#\n\nOs membros serão obrigados a mudar a senha no primeiro login.')) return;
    try {
      const res = await api.post('/auth/provisionar-membros');
      if (res.data.success) {
        if (res.data.criados === 0) {
          toast.success(res.data.message);
        } else {
          toast.success(`✅ ${res.data.criados} conta(s) criada(s) com sucesso!`);
        }
        fetchUtilizadores();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao provisionar contas.');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      toast.error('Não pode eliminar a sua própria conta.');
      return;
    }
    if (!window.confirm('Tem a certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita.')) return;

    try {
      await api.delete(`/utilizadores/${id}`);
      toast.success('Utilizador eliminado com sucesso.');
      fetchUtilizadores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao eliminar utilizador.');
    }
  };

  const filteredList = utilizadores.filter(u => {
    const q = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.perfil.toLowerCase().includes(q) ||
      (u.membro_nome || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-1)' }}>
              Gestão de Utilizadores
            </h1>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', paddingLeft: '52px' }}>
            Controlo de contas, acessos e permissões do painel administrativo
          </p>
          <div className="page-header-accent" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleProvisionarMembros}
            className="btn btn-outline flex items-center gap-2"
            title="Criar contas de acesso para todos os membros com email cadastrado"
          >
            <Zap size={15} />
            Provisionar Membros
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus size={16} />
            Adicionar Utilizador
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Pesquisar utilizadores por nome, email ou perfil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Nome</th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Email</th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Perfil</th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-3)' }}>Membro Associado</th>
                <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Estado</th>
                <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((cell) => (
                      <td key={cell} className="px-4 py-4"><div className="skeleton h-4 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                    <p className="font-semibold" style={{ color: 'var(--text-2)' }}>Nenhum utilizador encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredList.map((u) => {
                  const badge = getPerfilBadge(u.perfil);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5 font-bold" style={{ color: 'var(--text-1)' }}>{u.nome}</td>
                      <td className="px-4 py-3.5" style={{ color: 'var(--text-2)' }}>{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: badge.color, background: badge.bg }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell" style={{ color: 'var(--text-3)' }}>
                        {u.membro_nome ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{u.membro_nome}</span>
                            <span className="text-xs">ID: {u.numero_membro}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleAtivo(u)}
                          className="flex items-center gap-1 text-xs font-bold"
                          style={{ color: u.ativo ? '#10b981' : '#ef4444' }}
                          title="Clique para alternar estado"
                        >
                          {u.ativo ? <CheckCircle size={15} /> : <XCircle size={15} />}
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPassword(u)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-yellow-500 transition-all"
                            title="Alterar Palavra-passe"
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-blue-500 transition-all"
                            title="Editar"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-500 transition-all"
                            title="Eliminar"
                            disabled={u.id === currentUser.id}
                            style={{ opacity: u.id === currentUser.id ? 0.3 : 1 }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Formulário (Criar / Editar) ── */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full fade-in card p-6 space-y-4 relative">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Users size={18} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                {selectedUser ? 'Editar Utilizador' : 'Novo Utilizador'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="form-control pl-9"
                    placeholder="Ex: João da Silva"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control pl-9"
                    placeholder="email@sf-dgci.gw"
                    required
                  />
                </div>
              </div>

              {!selectedUser && (
                <div className="form-group">
                  <label className="form-label">Palavra-passe Inicial</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control pl-9"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Perfil de Acesso</label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                  className="form-control"
                >
                  {PERFIS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Membro Sindical Associado (Opcional)</label>
                <select
                  value={membroId}
                  onChange={(e) => setMembroId(e.target.value)}
                  className="form-control"
                >
                  <option value="">Não associar a nenhum membro</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome_completo} ({m.numero_membro})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="user-ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="user-ativo" className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-2)' }}>
                    Conta Ativa
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Redefinir Palavra-passe ── */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full fade-in card p-6 space-y-4 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg text-yellow-500" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <KeyRound size={18} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                Redefinir Palavra-passe
              </h2>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              A alterar a senha do utilizador <strong style={{ color: 'var(--text-1)' }}>{selectedUser?.nome}</strong> ({selectedUser?.email})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nova Palavra-passe</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-control pl-9"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilizadores;
