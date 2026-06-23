import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api, { getBackendUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import {
    Save, Plus, Pencil, Trash2, Users, Award,
    LayoutGrid, ChevronUp, ChevronDown, User, X,
    Camera, Image as ImageIcon
} from 'lucide-react';

const GRAD_OPTIONS = [
    { label: 'Azul → Índigo', value: 'from-blue-600 to-indigo-600' },
    { label: 'Índigo → Roxo', value: 'from-indigo-600 to-purple-600' },
    { label: 'Roxo → Rosa', value: 'from-purple-600 to-pink-600' },
    { label: 'Rosa → Vermelho', value: 'from-pink-600 to-red-600' },
    { label: 'Verde → Teal', value: 'from-green-600 to-teal-600' },
    { label: 'Âmbar → Laranja', value: 'from-amber-500 to-orange-600' },
    { label: 'Slate → Azul', value: 'from-slate-600 to-blue-700' },
];

const emptyMembro = { nome: '', cargo: '', email: '', telefone: '', iniciais: '', cor: 'from-blue-600 to-indigo-600', ordem: 0, foto_url: '' };

const SindicatoAdmin = () => {
    const [activeTab, setActiveTab] = useState('presidente');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Presidente / info
    const [info, setInfo] = useState({
        presidente_nome: '',
        presidente_cargo: 'Presidente da Direção',
        presidente_iniciais: '',
        presidente_lema: '',
        presidente_mensagem: '',
        organigrama_assembleia_geral: '',
        organigrama_direcao_nacional: '',
        organigrama_conselho_fiscal: '',
        organigrama_assembleia_delegados: '',
        organigrama_delegacoes_regionais: '',
    });

    // Membros
    const [membros, setMembros] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMembro, setEditingMembro] = useState(null);
    const [membroForm, setMembroForm] = useState(emptyMembro);
    const [savingMembro, setSavingMembro] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Fotos e refs
    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const fileInputRef = useRef(null);
    const presFileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sindicato');
            if (data.success) {
                setInfo(prev => ({ ...prev, ...data.data.info }));
                setMembros(data.data.membros || []);
            }
        } catch {
            toast.error('Erro ao carregar dados do sindicato');
        } finally {
            setLoading(false);
        }
    };

    // ── Info handler ──────────────────────────────────────────────
    const handleInfoChange = (e) => {
        setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/sindicato/info', info);
            toast.success('Informações guardadas com sucesso!');
        } catch {
            toast.error('Erro ao guardar informações');
        } finally {
            setSaving(false);
        }
    };

    // ── Foto Presidente ──────────────────────────────────────────
    const handlePresFotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('foto', file);

        const loadToast = toast.loading('A carregar foto do presidente...');
        try {
            const { data } = await api.post('/sindicato/presidente/foto', formData);
            if (data.success) {
                setInfo(prev => ({ ...prev, presidente_foto_url: data.foto_url }));
                toast.success('Foto do presidente atualizada!');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao carregar foto');
        } finally {
            toast.dismiss(loadToast);
        }
    };

    const handleRemovePresFoto = async () => {
        if (!confirm('Deseja remover a foto do presidente?')) return;
        try {
            await api.put('/sindicato/info', { presidente_foto_url: '' });
            setInfo(prev => ({ ...prev, presidente_foto_url: '' }));
            toast.success('Foto do presidente removida!');
        } catch {
            toast.error('Erro ao remover foto');
        }
    };

    // ── Membro modal handler ──────────────────────────────────────
    const openAddModal = () => {
        setEditingMembro(null);
        setMembroForm({ ...emptyMembro, ordem: membros.length });
        setFotoFile(null);
        setFotoPreview(null);
        setShowModal(true);
    };

    const openEditModal = (m) => {
        setEditingMembro(m);
        setMembroForm({
            nome: m.nome,
            cargo: m.cargo,
            email: m.email || '',
            telefone: m.telefone || '',
            iniciais: m.iniciais || '',
            cor: m.cor || 'from-blue-600 to-indigo-600',
            ordem: m.ordem || 0,
            foto_url: m.foto_url || ''
        });
        setFotoFile(null);
        setFotoPreview(m.foto_url ? (m.foto_url.startsWith('http') ? m.foto_url : `${getBackendUrl()}${m.foto_url}`) : null);
        setShowModal(true);
    };

    const handleMembroFormChange = (e) => {
        setMembroForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMembroFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveMembroFoto = async () => {
        if (!editingMembro) {
            setFotoFile(null);
            setFotoPreview(null);
            return;
        }
        if (!confirm('Deseja remover a foto deste membro?')) return;
        try {
            await api.delete(`/sindicato/membros/${editingMembro.id}/foto`);
            setFotoPreview(null);
            setFotoFile(null);
            toast.success('Foto removida!');
            fetchData();
        } catch {
            toast.error('Erro ao remover foto');
        }
    };

    const handleSaveMembro = async (e) => {
        e.preventDefault();
        if (!membroForm.nome || !membroForm.cargo) {
            toast.error('Nome e cargo são obrigatórios');
            return;
        }
        setSavingMembro(true);
        try {
            let savedMembro;
            if (editingMembro) {
                const { data } = await api.put(`/sindicato/membros/${editingMembro.id}`, membroForm);
                savedMembro = data.data;
                toast.success('Membro atualizado!');
            } else {
                const { data } = await api.post('/sindicato/membros', membroForm);
                savedMembro = data.data;
                toast.success('Membro adicionado!');
            }

            if (fotoFile) {
                const formData = new FormData();
                formData.append('foto', fotoFile);
                await api.post(`/sindicato/membros/${savedMembro.id}/foto`, formData);
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar membro');
        } finally {
            setSavingMembro(false);
        }
    };

    const handleDeleteMembro = async (id) => {
        if (!confirm('Tem a certeza que deseja remover este membro?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/sindicato/membros/${id}`);
            toast.success('Membro removido');
            fetchData();
        } catch {
            toast.error('Erro ao remover membro');
        } finally {
            setDeletingId(null);
        }
    };

    const moveOrdem = async (id, dir) => {
        const idx = membros.findIndex(m => m.id === id);
        const target = membros[idx + dir];
        if (!target) return;
        try {
            await Promise.all([
                api.put(`/sindicato/membros/${id}`, { ordem: target.ordem }),
                api.put(`/sindicato/membros/${target.id}`, { ordem: membros[idx].ordem }),
            ]);
            fetchData();
        } catch {
            toast.error('Erro ao reordenar');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center p-16">
            <div className="spinner" />
        </div>
    );

    const tabs = [
        { id: 'presidente', label: 'Presidente', icon: User },
        { id: 'direcao', label: 'Membros da Direção', icon: Users },
        { id: 'organigrama', label: 'Organigrama', icon: LayoutGrid },
    ];

    return (
        <div className="fade-in max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-[#0f2043]">Página "O Sindicato"</h1>
            <p className="text-gray-500 text-sm mt-1 mb-6">Gira o conteúdo da página pública do sindicato — presidente, direção e organigrama.</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 rounded-t-lg transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
                        >
                            <Icon size={14} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB: Presidente ───────────────────────────────────── */}
            {activeTab === 'presidente' && (
                <div className="card fade-in">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Award size={18} className="text-blue-600" /> Informações do Presidente
                    </h3>
                    <form onSubmit={handleSaveInfo} className="space-y-5">
                        {/* Presidente Foto Upload Area */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-dashed border-gray-200 bg-slate-50/50 mb-6">
                            <div className="relative group w-24 h-24 rounded-full overflow-hidden shadow-md bg-gradient-to-br from-yellow-400 to-amber-500 p-0.5">
                                {info.presidente_foto_url ? (
                                    <img
                                        src={info.presidente_foto_url.startsWith('http') ? info.presidente_foto_url : `${getBackendUrl()}${info.presidente_foto_url}`}
                                        alt="Presidente"
                                        className="w-full h-full rounded-full object-cover bg-white"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-[#1a2f5e] flex items-center justify-center font-black text-3xl text-yellow-400">
                                        {info.presidente_iniciais || '?'}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => presFileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                                >
                                    <Camera size={20} />
                                </button>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h4 className="font-bold text-slate-800 text-sm mb-1">Foto de Perfil do Presidente</h4>
                                <p className="text-xs text-gray-400 mb-3">Recomendado: imagem quadrada, JPG/PNG/WebP, máx. 5MB</p>
                                <div className="flex justify-center sm:justify-start gap-2">
                                    <button
                                        type="button"
                                        onClick={() => presFileInputRef.current?.click()}
                                        className="btn btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
                                    >
                                        <Camera size={14} /> Alterar Foto
                                    </button>
                                    {info.presidente_foto_url && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePresFoto}
                                            className="btn text-xs py-1.5 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Remover Foto
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={presFileInputRef}
                                    onChange={handlePresFotoChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="form-group">
                                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Nome Completo</label>
                                <input type="text" name="presidente_nome" value={info.presidente_nome || ''} onChange={handleInfoChange} className="form-control" placeholder="Dr. António Silva" />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Cargo / Título</label>
                                <input type="text" name="presidente_cargo" value={info.presidente_cargo || ''} onChange={handleInfoChange} className="form-control" placeholder="Presidente da Direção" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="form-group">
                                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Iniciais (avatar)</label>
                                <input type="text" name="presidente_iniciais" value={info.presidente_iniciais || ''} onChange={handleInfoChange} className="form-control max-w-[100px]" maxLength={3} placeholder="AS" />
                                <p className="text-xs text-gray-400 mt-1">Até 3 letras — exibidas no avatar circular.</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label text-xs uppercase tracking-wider text-gray-500">Lema / Citação</label>
                                <input type="text" name="presidente_lema" value={info.presidente_lema || ''} onChange={handleInfoChange} className="form-control" placeholder='"Pela união e integridade"' />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label text-xs uppercase tracking-wider text-gray-500">Mensagem do Presidente</label>
                            <textarea
                                name="presidente_mensagem"
                                value={info.presidente_mensagem || ''}
                                onChange={handleInfoChange}
                                className="form-control"
                                rows={8}
                                placeholder="Escreva a mensagem institucional aqui..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Suporta quebras de linha (Enter para novo parágrafo).</p>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button type="submit" disabled={saving} className="btn btn-primary">
                                <Save size={16} /> {saving ? 'A guardar...' : 'Guardar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── TAB: Membros da Direção ───────────────────────────── */}
            {activeTab === 'direcao' && (
                <div className="card fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-600" /> Membros da Direção Nacional
                        </h3>
                        <button onClick={openAddModal} className="btn btn-primary text-sm py-1.5 px-3">
                            <Plus size={16} /> Adicionar Membro
                        </button>
                    </div>

                    {membros.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Users size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nenhum membro adicionado ainda.</p>
                            <button onClick={openAddModal} className="mt-3 text-sm text-blue-600 hover:underline">Adicionar o primeiro membro</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {membros.map((m, idx) => (
                                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${m.cor || 'from-blue-600 to-indigo-600'} p-0.5 flex-shrink-0 overflow-hidden`}>
                                        {m.foto_url ? (
                                            <img
                                                src={m.foto_url.startsWith('http') ? m.foto_url : `${getBackendUrl()}${m.foto_url}`}
                                                alt={m.nome}
                                                className="w-full h-full rounded-full object-cover bg-white"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-base text-slate-700">
                                                {m.iniciais}
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{m.nome}</p>
                                        <p className="text-xs text-blue-600 font-medium">{m.cargo}</p>
                                        {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                                    </div>
                                    {/* Badge ativo */}
                                    <span className={`badge ${m.ativo ? 'badge-success' : 'badge-danger'} text-xs hidden sm:inline`}>
                                        {m.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                    {/* Reordenar */}
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => moveOrdem(m.id, -1)} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
                                        <button onClick={() => moveOrdem(m.id, 1)} disabled={idx === membros.length - 1} className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
                                    </div>
                                    {/* Ações */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => openEditModal(m)} className="btn btn-outline py-1 px-2.5 text-xs"><Pencil size={13} /> Editar</button>
                                        <button onClick={() => handleDeleteMembro(m.id)} disabled={deletingId === m.id} className="btn text-xs py-1 px-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            {deletingId === m.id ? '...' : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: Organigrama ──────────────────────────────────── */}
            {activeTab === 'organigrama' && (
                <div className="card fade-in">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <LayoutGrid size={18} className="text-blue-600" /> Descrições do Organigrama
                    </h3>
                    <form onSubmit={handleSaveInfo} className="space-y-5">
                        {[
                            { key: 'organigrama_assembleia_geral', label: 'Assembleia Geral' },
                            { key: 'organigrama_direcao_nacional', label: 'Direção Nacional' },
                            { key: 'organigrama_conselho_fiscal', label: 'Conselho Fiscal' },
                            { key: 'organigrama_assembleia_delegados', label: 'Assembleia de Delegados' },
                            { key: 'organigrama_delegacoes_regionais', label: 'Delegações Regionais' },
                        ].map(({ key, label }) => (
                            <div key={key} className="form-group">
                                <label className="form-label text-xs uppercase tracking-wider text-gray-500">{label}</label>
                                <textarea
                                    name={key}
                                    value={info[key] || ''}
                                    onChange={handleInfoChange}
                                    className="form-control"
                                    rows={2}
                                />
                            </div>
                        ))}
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button type="submit" disabled={saving} className="btn btn-primary">
                                <Save size={16} /> {saving ? 'A guardar...' : 'Guardar Organigrama'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── MODAL: Adicionar / Editar Membro ─────────────────── */}
            {showModal && createPortal(
                <div className="modal-backdrop">
                    <div className="modal-card max-w-lg">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Users size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{editingMembro ? 'Editar Membro' : 'Adicionar Membro'}</h3>
                                    <p className="text-xs text-slate-500">Preencha os dados do membro da direção</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <form id="form-membro" onSubmit={handleSaveMembro} className="space-y-4">
                                {/* Membro Foto Upload Area */}
                                <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 mb-2">
                                    <div className="relative group w-16 h-16 rounded-full overflow-hidden shadow bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 flex-shrink-0">
                                        {fotoPreview ? (
                                            <img
                                                src={fotoPreview}
                                                alt="Membro"
                                                className="w-full h-full rounded-full object-cover bg-white"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-lg text-slate-700">
                                                {membroForm.iniciais || (membroForm.nome ? membroForm.nome.split(' ').slice(0,2).map(n=>n[0]).join('') : '?')}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                                        >
                                            <Camera size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-slate-800 text-xs mb-0.5">Foto do Membro</h5>
                                        <p className="text-[10px] text-gray-400 mb-2">Máximo 5MB, JPG/PNG/WebP</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="btn btn-outline py-1 px-2.5 text-[10px] flex items-center gap-1"
                                            >
                                                <Camera size={12} /> Escolher Ficheiro
                                            </button>
                                            {fotoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveMembroFoto}
                                                    className="btn text-[10px] py-1 px-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    Remover
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleMembroFotoChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Nome Completo *</label>
                                        <input type="text" name="nome" value={membroForm.nome} onChange={handleMembroFormChange} className="form-control" required />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Cargo / Função *</label>
                                        <input type="text" name="cargo" value={membroForm.cargo} onChange={handleMembroFormChange} className="form-control" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email" value={membroForm.email} onChange={handleMembroFormChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telefone</label>
                                        <input type="text" name="telefone" value={membroForm.telefone} onChange={handleMembroFormChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Iniciais (avatar)</label>
                                        <input type="text" name="iniciais" value={membroForm.iniciais} onChange={handleMembroFormChange} className="form-control" maxLength={3} placeholder="Ex: AS" />
                                        <p className="text-xs text-gray-400 mt-0.5">Deixe vazio para gerar automático.</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ordem</label>
                                        <input type="number" name="ordem" value={membroForm.ordem} onChange={handleMembroFormChange} className="form-control" min={0} />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Cor do Avatar</label>
                                        <div className="form-control-select-wrapper">
                                            <select name="cor" value={membroForm.cor} onChange={handleMembroFormChange} className="form-control">
                                                {GRAD_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                            </select>
                                        </div>
                                        {/* Preview */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${membroForm.cor} p-0.5`}>
                                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-sm text-slate-700">
                                                    {membroForm.iniciais || (membroForm.nome ? membroForm.nome.split(' ').slice(0,2).map(n=>n[0]).join('') : '?')}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">Pré-visualização</span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                            <button type="submit" form="form-membro" disabled={savingMembro} className="btn btn-primary">
                                {savingMembro ? 'A guardar...' : (editingMembro ? 'Atualizar Membro' : 'Adicionar Membro')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SindicatoAdmin;
