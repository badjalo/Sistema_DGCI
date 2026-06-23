import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Inbox, Mail, MailOpen, CheckCircle2, Clock, Trash2,
    Search, RefreshCw, MessageSquare, User, Calendar,
    Send, X, Tag, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';

// ─── BADGE estado ─────────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }) => {
    const cfg = {
        pendente:    { cls: 'bg-amber-100 text-amber-700',   icon: Clock,         label: 'Pendente' },
        lida:        { cls: 'bg-blue-100 text-blue-700',     icon: MailOpen,      label: 'Lida' },
        respondida:  { cls: 'bg-green-100 text-green-700',   icon: CheckCircle2,  label: 'Respondida' },
    };
    const { cls, icon: Icon, label } = cfg[estado] || cfg.pendente;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cls}`}>
            <Icon size={10} /> {label}
        </span>
    );
};

// ─── MODAL DE DETALHE + RESPOSTA ──────────────────────────────────────────────
const MensagemModal = ({ mensagem, onClose, onResponded }) => {
    const [resposta, setResposta] = useState('');
    const [sending, setSending] = useState(false);

    const handleResponder = async () => {
        if (!resposta.trim()) return toast.error('A resposta não pode estar vazia.');
        setSending(true);
        try {
            await api.post(`/contacto/${mensagem.id}/resposta`, { resposta });
            toast.success('Resposta registada com sucesso!');
            onResponded();
            onClose();
        } catch {
            toast.error('Erro ao enviar resposta.');
        } finally {
            setSending(false);
        }
    };

    const assuntoLabels = {
        informacao: 'Pedido de Informação',
        filiacao: 'Filiação ao Sindicato',
        reclamacao: 'Reclamação',
        sugestao: 'Sugestão',
        'apoio-juridico': 'Apoio Jurídico',
        outro: 'Outro Assunto',
    };

    return createPortal(
        <div className="modal-backdrop">
            <div className="modal-card max-w-2xl">
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MessageSquare size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Mensagem de Contacto</h3>
                            <p className="text-xs text-slate-500">#{mensagem.id} · {new Date(mensagem.criado_em).toLocaleString('pt-PT')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body space-y-5">
                    {/* Dados do remetente */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1"><User size={10} /> Nome</p>
                            <p className="text-sm font-bold text-slate-800">{mensagem.nome}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1"><Mail size={10} /> Email</p>
                            <a href={`mailto:${mensagem.email}`} className="text-sm font-semibold text-blue-600 hover:underline break-all">{mensagem.email}</a>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1"><Tag size={10} /> Assunto</p>
                            <p className="text-sm font-bold text-slate-800">{assuntoLabels[mensagem.assunto] || mensagem.assunto}</p>
                        </div>
                    </div>

                    {/* Mensagem */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Mensagem</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {mensagem.mensagem}
                        </div>
                    </div>

                    {/* Resposta existente */}
                    {mensagem.resposta && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-green-500 mb-2 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Resposta enviada · por {mensagem.respondido_por} em {new Date(mensagem.respondido_em).toLocaleDateString('pt-PT')}
                            </p>
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                                {mensagem.resposta}
                            </div>
                        </div>
                    )}

                    {/* Campo de resposta (desativado se já respondida) */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">
                            {mensagem.estado === 'respondida' ? 'Adicionar nova resposta' : 'Escrever Resposta *'}
                        </label>
                        <textarea
                            value={resposta}
                            onChange={e => setResposta(e.target.value)}
                            rows={4}
                            placeholder="Escreva aqui a sua resposta ao remetente..."
                            className="form-control resize-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            A resposta será registada internamente na base de dados para controlo do sistema.
                        </p>
                    </div>

                    {/* Aviso de e-mail oficial */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                        <span className="text-amber-600 text-sm mt-0.5">⚠️</span>
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <p className="font-bold">Aviso de Resposta</p>
                            <p>Certifique-se de que a resposta final é enviada através do e-mail oficial do sindicato: <strong className="underline">sf-dgci@dgci.mef.gw</strong>.</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-outline">Fechar</button>
                    <a
                        href={`mailto:${mensagem.email}?subject=Re: ${assuntoLabels[mensagem.assunto] || mensagem.assunto}&body=${encodeURIComponent(
                            `${resposta}\n\n--\nAtenciosamente,\nDireção do Sindicato dos Funcionários da DGCI (SF-DGCI)\nEmail Oficial: sf-dgci@dgci.mef.gw`
                        )}`}
                        className="btn btn-outline flex items-center gap-2"
                        target="_blank" rel="noreferrer"
                    >
                        <Mail size={14} /> Abrir Email
                    </a>
                    <button
                        onClick={handleResponder}
                        disabled={sending || !resposta.trim()}
                        className="btn btn-primary"
                    >
                        {sending ? 'A guardar...' : <><Send size={14} /> Guardar Resposta</>}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Mensagens = () => {
    const [mensagens, setMensagens] = useState([]);
    const [stats, setStats] = useState({ pendentes: 0, lidas: 0, respondidas: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selected, setSelected] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filtroEstado !== 'todos') params.estado = filtroEstado;

            const [msgRes, statsRes] = await Promise.all([
                api.get('/contacto', { params }),
                api.get('/contacto/stats'),
            ]);

            if (msgRes.data.success) {
                setMensagens(msgRes.data.data);
                setTotalPages(msgRes.data.totalPages || 1);
            }
            if (statsRes.data.success) setStats(statsRes.data.data);
        } catch {
            toast.error('Erro ao carregar mensagens.');
        } finally {
            setLoading(false);
        }
    }, [filtroEstado, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openMensagem = async (msg) => {
        try {
            const res = await api.get(`/contacto/${msg.id}`);
            if (res.data.success) setSelected(res.data.data);
        } catch {
            toast.error('Erro ao abrir mensagem.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Eliminar esta mensagem permanentemente?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/contacto/${id}`);
            toast.success('Mensagem eliminada.');
            fetchData();
        } catch {
            toast.error('Erro ao eliminar.');
        } finally {
            setDeletingId(null);
        }
    };

    // Filtro de pesquisa local
    const filtered = mensagens.filter(m =>
        !search ||
        m.nome.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.assunto.toLowerCase().includes(search.toLowerCase())
    );

    const assuntoLabels = {
        informacao: 'Pedido de Informação',
        filiacao: 'Filiação',
        reclamacao: 'Reclamação',
        sugestao: 'Sugestão',
        'apoio-juridico': 'Apoio Jurídico',
        outro: 'Outro',
    };

    return (
        <div className="fade-in max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f2043]">Mensagens de Contacto</h1>
                    <p className="text-gray-500 text-sm mt-1">Gerencie as mensagens enviadas pelo formulário público.</p>
                </div>
                <button onClick={fetchData} className="btn btn-outline py-1.5 px-3 text-sm">
                    <RefreshCw size={14} /> Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total',       value: stats.total,       icon: Inbox,        color: 'text-slate-600 bg-slate-100' },
                    { label: 'Pendentes',   value: stats.pendentes,   icon: Clock,        color: 'text-amber-600 bg-amber-100' },
                    { label: 'Lidas',       value: stats.lidas,       icon: MailOpen,     color: 'text-blue-600 bg-blue-100' },
                    { label: 'Respondidas', value: stats.respondidas, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card py-4 px-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{value ?? 0}</p>
                            <p className="text-xs text-gray-400 font-medium">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros + Pesquisa */}
            <div className="card mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Pesquisa */}
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, email ou assunto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="form-control pl-8 py-2 text-sm"
                        />
                    </div>
                    {/* Filtro estado */}
                    <div className="flex gap-2 flex-wrap">
                        {['todos', 'pendente', 'lida', 'respondida'].map(e => (
                            <button
                                key={e}
                                onClick={() => { setFiltroEstado(e); setPage(1); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize ${
                                    filtroEstado === e
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {e === 'todos' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="card">
                {loading ? (
                    <div className="space-y-3 p-2">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhuma mensagem encontrada.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(m => (
                            <div
                                key={m.id}
                                className={`flex items-center gap-4 py-4 px-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group ${
                                    m.estado === 'pendente' ? 'bg-amber-50/30' : ''
                                }`}
                                onClick={() => openMensagem(m)}
                            >
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                    m.estado === 'pendente' ? 'bg-amber-100 text-amber-700' :
                                    m.estado === 'respondida' ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {m.nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className={`font-bold text-sm truncate ${m.estado === 'pendente' ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {m.nome}
                                        </p>
                                        {m.estado === 'pendente' && (
                                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        <span className="font-medium text-blue-600">{assuntoLabels[m.assunto] || m.assunto}</span>
                                        {' · '}{m.email}
                                    </p>
                                </div>

                                {/* Estado + Data */}
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <EstadoBadge estado={m.estado} />
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(m.criado_em).toLocaleDateString('pt-PT')}
                                    </p>
                                </div>

                                {/* Acções */}
                                <div
                                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => openMensagem(m)}
                                        title="Responder"
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Send size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(m.id)}
                                        disabled={deletingId === m.id}
                                        title="Eliminar"
                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100 mt-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-gray-600 font-medium">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selected && (
                <MensagemModal
                    mensagem={selected}
                    onClose={() => setSelected(null)}
                    onResponded={fetchData}
                />
            )}
        </div>
    );
};

export default Mensagens;
