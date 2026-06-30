import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBackendUrl } from '../services/api';
import {
    ChevronLeft, Users, Shield, Award, Building, Mail, Menu, X, Lock, Target, Eye
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicNavbar from '../components/PublicNavbar';



// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = () => (
    <section className="relative min-h-[320px] flex flex-col justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0f1f42 0%, #1a2f5e 100%)' }} />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full border border-white/5 z-0" />
        <div className="absolute bottom-40 left-10 w-56 h-56 rounded-full border border-white/5 z-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                O Sindicato <span className="text-[#facc15]">SF-DGCI</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Conheça a nossa estrutura diretiva, compromisso e a organização interna focada na defesa de todos os associados.
            </p>
        </div>
    </section>
);

// ─── SKELETON ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded ${className}`} />
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const Sindicato = () => {
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState({});
    const [membros, setMembros] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get('/sindicato/public');
                if (data.success) {
                    setInfo(data.data.info || {});
                    setMembros(data.data.membros || []);
                }
            } catch (err) {
                console.error('Erro ao carregar dados do sindicato:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Formatar mensagem em parágrafos
    const renderMensagem = (texto) => {
        if (!texto) return null;
        return texto.split('\n').filter(p => p.trim()).map((p, i) => (
            <p key={i} className={i === texto.split('\n').filter(x => x.trim()).length - 1 ? 'font-semibold text-[#1a2f5e]' : ''}>
                {p}
            </p>
        ));
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0d1117] flex flex-col font-sans antialiased text-slate-800 dark:text-[#e6edf4] transition-colors duration-200">
            <PublicNavbar />
            <HeroSection />

            {/* ── 1. MENSAGEM DO PRESIDENTE ──────────────────────────────────── */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    {/* Coluna Esquerda — Avatar + Nome */}
                    <div className="lg:col-span-4 bg-gradient-to-br from-[#1a2f5e] to-[#0f1f42] p-10 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-8 -mb-8" />

                        {loading ? (
                            <>
                                <Skeleton className="w-56 h-56 rounded-full mb-6" />
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </>
                        ) : (
                            <>
                                <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 p-1.5 shadow-xl mb-6 relative z-10 overflow-hidden">
                                    {info.presidente_foto_url ? (
                                        <img
                                            src={info.presidente_foto_url.startsWith('http') ? info.presidente_foto_url : `${getBackendUrl()}${info.presidente_foto_url}`}
                                            alt={info.presidente_nome || 'Presidente'}
                                            className="w-full h-full rounded-full object-cover bg-white"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-[#1a2f5e] flex items-center justify-center font-black text-6xl text-yellow-400 tracking-wider">
                                            {info.presidente_iniciais || '?'}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold mb-1 relative z-10">{info.presidente_nome || 'Presidente'}</h3>
                                <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-4 relative z-10">
                                    {info.presidente_cargo || 'Presidente da Direção'}
                                </p>
                                <div className="w-12 h-0.5 bg-yellow-400/50 my-2" />
                                {info.presidente_lema && (
                                    <span className="text-[10px] text-slate-400 italic">{info.presidente_lema}</span>
                                )}
                            </>
                        )}
                    </div>

                    {/* Coluna Direita — Mensagem */}
                    <div className="lg:col-span-8 p-8 sm:p-12 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-6 w-fit">
                            <Award size={12} /> Nota da Presidência
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#0f1f42] mb-6">Mensagem do Presidente</h2>

                        {loading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/6" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
                                {renderMensagem(info.presidente_mensagem) || (
                                    <p className="text-gray-400 italic">Nenhuma mensagem disponível de momento.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── 2. MEMBROS DA DIREÇÃO ──────────────────────────────────────── */}
            <section className="py-20 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                            <Users size={12} /> Equipa Diretiva
                        </div>
                        <h2 className="text-3xl font-black text-[#0f1f42] mb-4">Membros da Direção Nacional</h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">
                            Conheça os profissionais eleitos que integram a direção e trabalham na gestão ativa dos interesses da nossa comunidade.
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center">
                                    <Skeleton className="w-20 h-20 rounded-full mb-4" />
                                    <Skeleton className="h-4 w-28 mb-2" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : membros.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nenhum membro da direção configurado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {membros.map((m) => (
                                <div key={m.id} className="group bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:bg-white hover:border-[#1a2f5e]/20 transition-all duration-300 flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${m.cor || 'from-blue-600 to-indigo-600'} p-1 shadow-md mb-5 group-hover:scale-105 transition-transform duration-300 overflow-hidden`}>
                                        {m.foto_url ? (
                                            <img
                                                src={m.foto_url.startsWith('http') ? m.foto_url : `${getBackendUrl()}${m.foto_url}`}
                                                alt={m.nome}
                                                className="w-full h-full rounded-full object-cover bg-white"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xl text-slate-700">
                                                {m.iniciais || m.nome?.split(' ').slice(0,2).map(n => n[0]).join('')}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-base mb-1">{m.nome}</h3>
                                    <p className="text-xs text-blue-600 font-semibold mb-4">{m.cargo}</p>
                                    {m.email && (
                                        <div className="mt-auto w-full pt-4 border-t border-slate-200/60 text-xs text-gray-500">
                                            <div className="flex items-center justify-center gap-1.5 hover:text-blue-600 transition-colors">
                                                <Mail size={12} />
                                                <span className="truncate">{m.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── 3. MISSÃO, VISÃO E VALORES ──────────────────────────────────── */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border border-yellow-200">
                            <Award size={12} /> Identidade Sindical
                        </div>
                        <h2 className="text-3xl font-black text-[#0f1f42] mb-3">Missão, Visão e Valores</h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">
                            Os pilares que orientam a nossa ação e definem o compromisso do SF-DGCI com os seus membros.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Target,
                                color: 'text-blue-600',
                                bg: 'bg-blue-50',
                                border: 'border-blue-100 hover:border-blue-300',
                                title: 'Missão',
                                text: 'Defender os direitos e interesses dos funcionários da DGCI, promovendo condições de trabalho dignas e o desenvolvimento profissional dos seus membros.'
                            },
                            {
                                icon: Eye,
                                color: 'text-yellow-600',
                                bg: 'bg-yellow-50',
                                border: 'border-yellow-100 hover:border-yellow-300',
                                title: 'Visão',
                                text: 'Ser uma organização sindical de referência na Guiné-Bissau, reconhecida pela sua capacidade de diálogo, transparência e defesa da classe trabalhadora.'
                            },
                            {
                                icon: Shield,
                                color: 'text-green-600',
                                bg: 'bg-green-50',
                                border: 'border-green-100 hover:border-green-300',
                                title: 'Valores',
                                text: 'Democracia, solidariedade, transparência, integridade e responsabilidade social são os pilares que guiam todas as nossas ações.'
                            },
                        ].map(({ icon: Icon, color, bg, border, title, text }) => (
                            <div key={title} className={`group bg-white rounded-2xl border ${border} p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center`}>
                                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={26} className={color} />
                                </div>
                                <h3 className="font-black text-[#0f1f42] text-lg mb-3">{title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 4. ORGANIGRAMA ────────────────────────────────────────────── */}
            <section className="py-20 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                            <Shield size={12} /> Estrutura
                        </div>
                        <h2 className="text-3xl font-black text-[#0f1f42] mb-4">Organigrama Institucional</h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">
                            A distribuição de competências e órgãos estatutários garante decisões democráticas e fiscalizadas.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Nível 1: Assembleia Geral */}
                        <div className="flex justify-center">
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 p-6 rounded-2xl shadow-md border border-yellow-400 max-w-sm w-full text-center relative">
                                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full h-8 w-0.5 bg-yellow-400" />
                                <h3 className="font-black text-sm uppercase tracking-wider mb-1">Assembleia Geral</h3>
                                {loading
                                    ? <Skeleton className="h-3 w-full mt-2" />
                                    : <p className="text-xs font-medium opacity-90">{info.organigrama_assembleia_geral}</p>
                                }
                            </div>
                        </div>

                        <div className="h-2" />

                        {/* Nível 2: Direção + Conselho Fiscal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative pt-4">
                            <div className="hidden md:block absolute top-0 left-1/4 right-1/4 h-0.5 bg-slate-300" />
                            {[
                                { key: 'organigrama_direcao_nacional', label: 'Direção Nacional', icon: Building, color: 'bg-blue-50 text-blue-700' },
                                { key: 'organigrama_conselho_fiscal', label: 'Conselho Fiscal', icon: Award, color: 'bg-purple-50 text-purple-700' },
                            ].map(({ key, label, icon: Icon, color }) => (
                                <div key={key} className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 text-center relative">
                                    <div className="hidden md:block absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full h-4 w-0.5 bg-slate-300" />
                                    <div className={`inline-flex p-2.5 ${color} rounded-xl mb-3`}>
                                        <Icon size={20} />
                                    </div>
                                    <h4 className="font-bold text-[#0f1f42] text-base mb-1">{label}</h4>
                                    {loading
                                        ? <Skeleton className="h-3 w-full mt-2" />
                                        : <p className="text-xs text-gray-500 leading-relaxed">{info[key]}</p>
                                    }
                                </div>
                            ))}
                        </div>

                        <div className="h-2" />

                        {/* Nível 3: Delegados + Regionais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            {[
                                { key: 'organigrama_assembleia_delegados', label: 'Assembleia de Delegados' },
                                { key: 'organigrama_delegacoes_regionais', label: 'Delegações Regionais' },
                            ].map(({ key, label }) => (
                                <div key={key} className="bg-white/80 backdrop-blur p-5 rounded-2xl border border-slate-100 text-center">
                                    <h5 className="font-semibold text-slate-800 text-sm mb-1">{label}</h5>
                                    {loading
                                        ? <Skeleton className="h-3 w-full mt-2" />
                                        : <p className="text-[11px] text-gray-500 leading-relaxed">{info[key]}</p>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────────── */}
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

export default Sindicato;
