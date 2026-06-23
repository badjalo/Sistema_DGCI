import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Phone, Mail, MapPin, Clock, Send, CheckCircle,
    Building2, Menu, X, Lock, Globe, MessageSquare,
    ChevronRight, AlertCircle
} from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';
import PublicNavbar from '../components/PublicNavbar';

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = () => (
    <section className="relative min-h-[320px] flex flex-col justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0f1f42 0%, #1a2f5e 100%)' }} />
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full border border-white/5 z-0" />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full border border-white/5 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-yellow-400/30">
                <MessageSquare size={12} /> Fale Connosco
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Entre em <span className="text-[#facc15]">Contacto</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Estamos disponíveis para responder a todas as suas questões, sugestões ou reclamações. A sua voz é importante para nós.
            </p>
        </div>
    </section>
);

// ─── CONTACT CARD ────────────────────────────────────────────────────────────
const ContactCard = ({ icon: Icon, title, lines, color, href }) => (
    <div className="group bg-white dark:bg-[#161b27] rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={22} className="text-white" />
        </div>
        <h3 className="font-bold text-[#0f1f42] dark:text-white text-base mb-2">{title}</h3>
        <div className="space-y-1">
            {lines.map((line, i) =>
                href ? (
                    <a key={i} href={`${href}${line}`}
                        className="block text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {line}
                    </a>
                ) : (
                    <p key={i} className="text-sm text-gray-500 dark:text-gray-400">{line}</p>
                )
            )}
        </div>
    </div>
);

// ─── CONTACT FORM ────────────────────────────────────────────────────────────
const ContactForm = () => {
    const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            await api.post('/contacto', form);
            setSent(true);
            setForm({ nome: '', email: '', assunto: '', mensagem: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Ocorreu um erro ao enviar a mensagem. Tente novamente.');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16 px-8">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-[#0f1f42] dark:text-white mb-3">Mensagem Enviada!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-8">
                    Obrigado pela sua mensagem. A nossa equipa entrará em contacto brevemente.
                </p>
                <button
                    onClick={() => setSent(false)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    Enviar outra mensagem <ChevronRight size={16} />
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        required
                        placeholder="Ex: João Silva"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="exemplo@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Assunto *
                </label>
                <div className="relative">
                    <select
                        name="assunto"
                        value={form.assunto}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all appearance-none"
                    >
                        <option value="">Selecione o assunto...</option>
                        <option value="informacao">Pedido de Informação</option>
                        <option value="filiacao">Filiação ao Sindicato</option>
                        <option value="reclamacao">Reclamação</option>
                        <option value="sugestao">Sugestão</option>
                        <option value="apoio-juridico">Apoio Jurídico</option>
                        <option value="outro">Outro Assunto</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Mensagem *
                </label>
                <textarea
                    name="mensagem"
                    value={form.mensagem}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Escreva a sua mensagem aqui..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all resize-none"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-[#1a2f5e] hover:bg-[#0f1f42] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm"
            >
                {sending ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        A enviar...
                    </>
                ) : (
                    <>
                        <Send size={16} /> Enviar Mensagem
                    </>
                )}
            </button>
            <p className="text-center text-[11px] text-gray-400">
                Os campos marcados com * são obrigatórios. A sua informação é tratada de forma confidencial.
            </p>
        </form>
    );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const Contacto = () => {
    const contactInfo = [
        {
            icon: MapPin,
            title: 'Morada',
            color: 'bg-gradient-to-br from-blue-500 to-blue-700',
            lines: [
                'Av. Amílcar Cabral, n.º 1',
                'Bissau, Guiné-Bissau',
            ],
        },
        {
            icon: Phone,
            title: 'Telefone / WhatsApp',
            color: 'bg-gradient-to-br from-green-500 to-green-700',
            href: 'tel:',
            lines: ['+245 955 000 000', '+245 966 000 000'],
        },
        {
            icon: Mail,
            title: 'Email',
            color: 'bg-gradient-to-br from-yellow-500 to-amber-600',
            href: 'mailto:',
            lines: ['sf-dgci@dgci.mef.gw'],
        },
        {
            icon: Clock,
            title: 'Horário de Atendimento',
            color: 'bg-gradient-to-br from-purple-500 to-purple-700',
            lines: ['Segunda a Sexta: 08h00 – 17h00', 'Sábado: 09h00 – 12h00'],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0d1117] flex flex-col font-sans antialiased text-slate-800 dark:text-[#e6edf4] transition-colors duration-200">
            <PublicNavbar />
            <HeroSection />

            {/* ── CONTACT CARDS ──────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-8 relative z-10 mb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {contactInfo.map((item) => (
                        <ContactCard key={item.title} {...item} />
                    ))}
                </div>
            </section>

            {/* ── FORM + MAP ──────────────────────────────────────────────── */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white dark:bg-[#161b27] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl p-8">
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                                    <MessageSquare size={12} /> Formulário de Contacto
                                </div>
                                <h2 className="text-2xl font-black text-[#0f1f42] dark:text-white mb-2">Envie-nos uma Mensagem</h2>
                                <p className="text-gray-400 dark:text-gray-500 text-sm">
                                    Preencha o formulário e responderemos o mais breve possível.
                                </p>
                            </div>
                            <ContactForm />
                        </div>
                    </div>

                    {/* Right: Info + Map */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Info box */}
                        <div className="bg-gradient-to-br from-[#1a2f5e] to-[#0f1f42] rounded-2xl p-7 text-white shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
                                    <Building2 size={20} className="text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base">SF-DGCI</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Sindicato dos Funcionários da DGCI</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: MapPin, label: 'Av. Amílcar Cabral, n.º 1, Bissau' },
                                    { icon: Phone, label: '+245 955 000 000' },
                                    { icon: Mail, label: 'sf-dgci@dgci.mef.gw' },
                                    { icon: Globe, label: 'www.sf-dgci.gw' },
                                    { icon: Clock, label: 'Seg–Sex: 08h00–17h00' },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Icon size={14} className="text-yellow-400" />
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-7 pt-6 border-t border-white/10">
                                <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Redes Sociais</p>
                                <div className="flex gap-3">
                                    {['Facebook', 'WhatsApp'].map((rede) => (
                                        <a key={rede} href="#"
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors">
                                            {rede}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* FAQ Card */}
                        <div className="bg-white dark:bg-[#161b27] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                            <h3 className="font-black text-[#0f1f42] dark:text-white text-base mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xs font-black">?</span>
                                Perguntas Frequentes
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { q: 'Como me filio ao sindicato?', a: 'Contacte-nos por email ou dirija-se à sede para obter o formulário de filiação.' },
                                    { q: 'Onde posso ver as minhas quotas?', a: 'Aceda ao sistema através do botão "Entrar no Sistema" com as suas credenciais.' },
                                    { q: 'Qual o prazo de resposta?', a: 'Respondemos a todas as mensagens no prazo máximo de 2 dias úteis.' },
                                ].map(({ q, a }) => (
                                    <div key={q} className="pb-3 border-b border-gray-50 dark:border-slate-800 last:border-0 last:pb-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{q}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <footer className="mt-auto" style={{ background: '#0a1628' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                    <p className="text-slate-500 text-xs mb-1">
                        © {new Date().getFullYear()} SF-DGCI — Todos os direitos reservados
                    </p>
                    <p className="text-slate-500 text-xs">
                        República da Guiné-Bissau • Ministério das Finanças
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Contacto;
