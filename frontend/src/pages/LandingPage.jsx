import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Star, Shield, Users, FileText, CreditCard, BarChart3,
  Bell, Settings, CheckCircle, ArrowRight, Menu, X,
  Building2, Phone, Mail, MapPin, Zap, Lock, Globe, Award
} from 'lucide-react';
import logo from '../assets/logo.jpeg';

// ─── NAVBAR ────────────────────────────────────────────────────────────────
const Navbar = ({ configs }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Sobre', href: '#about' },
    { label: 'Contacto', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="SF-DGCI Logo"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-yellow-400 shadow"
            />
            <div className="leading-tight">
              <p className="text-sm font-black text-[#1a2f5e] tracking-wide">{configs?.sigla || 'SF-DGCI'}</p>
              <p className="text-[10px] text-gray-500 font-medium">Sistema de Gestão Sindical</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-semibold text-gray-600 hover:text-[#1a2f5e] transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#1a2f5e] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0f1f42] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Lock size={14} />
              Entrar no Sistema
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-semibold text-gray-700 hover:text-[#1a2f5e]"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#1a2f5e] text-white text-sm font-bold px-5 py-2.5 rounded-xl mt-2"
            >
              <Lock size={14} /> Entrar no Sistema
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// ─── HERO ───────────────────────────────────────────────────────────────────
const Hero = ({ configs }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-GW', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(val);
  };

  const stats = [
    { value: configs?.stats?.totalMembros ?? 0, label: 'Membros Registados' },
    { value: configs?.stats?.totalFundoSocial ?? 0, label: 'Fundo Social' },
    { value: formatCurrency(configs?.stats?.totalReceita ?? 0), label: 'Total de Receita' },
    { value: formatCurrency(configs?.stats?.totalDespesa ?? 0), label: 'Total de Despesa' },
    { value: formatCurrency(configs?.stats?.saldoDisponivel ?? 0), label: 'Saldo Disponível' },
    { value: '100%', label: 'Seguro & Digital' },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(135deg, #0f1f42 0%, #1a2f5e 60%, #1e3a6e 100%)' }}
      />

      {/* Watermark logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          src={logo}
          alt=""
          className="w-[520px] h-[520px] rounded-full object-cover"
          style={{ opacity: 0.04, filter: 'grayscale(100%)' }}
        />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full border border-white/5 z-0" />
      <div className="absolute top-32 right-20 w-48 h-48 rounded-full border border-white/5 z-0" />
      <div className="absolute bottom-40 left-10 w-56 h-56 rounded-full border border-white/5 z-0" />
      <div className="absolute -bottom-10 left-40 w-80 h-80 rounded-full border border-white/5 z-0" />
      <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-yellow-400/5 blur-2xl z-0" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          Sistema Oficial
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 max-w-4xl">
          {configs?.nome_sindicato ? (
            configs.nome_sindicato.includes(' ') ? (
              <>
                {configs.nome_sindicato.substring(0, configs.nome_sindicato.lastIndexOf(' '))} {' '}
                <span className="text-[#facc15]">{configs.nome_sindicato.substring(configs.nome_sindicato.lastIndexOf(' ') + 1)}</span>
              </>
            ) : (
              <span className="text-[#facc15]">{configs.nome_sindicato}</span>
            )
          ) : (
            <>
              Sindicato dos Funcionários da <span className="text-[#facc15]">DGCI</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Plataforma oficial de gestão sindical da Direção Geral das Contribuições e Impostos.
          Gerencie membros, quotas, documentos e comunicados de forma eficiente, segura e digital.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#0f1f42] font-black text-base px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-400/30 hover:scale-105"
          >
            Aceder ao Sistema <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold text-base px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            Ver Funcionalidades
          </a>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full max-w-5xl">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border border-white/15 bg-white/5 backdrop-blur-sm rounded-xl px-2 py-3 text-center flex flex-col items-center justify-center min-w-0"
            >
              <p className="text-sm sm:text-base font-black text-yellow-400 leading-tight break-words w-full">{s.value}</p>
              <p className="text-slate-400 text-[10px] mt-1 font-medium leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FEATURES ───────────────────────────────────────────────────────────────
const features = [
  {
    icon: <Users size={22} />,
    title: 'Gestão de Membros',
    desc: 'Registo completo de filiados com perfis, fotos, dados profissionais e histórico de atividade sindical.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Cartão Digital',
    desc: 'Emissão de cartões de identificação profissionais com QR Code, exportáveis em alta resolução para impressão.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Controlo Financeiro',
    desc: 'Gestão completa de quotas mensais, pagamentos, dívidas e relatórios financeiros automatizados.',
  },
  {
    icon: <FileText size={22} />,
    title: 'Documentos',
    desc: 'Repositório centralizado de documentos oficiais com upload seguro, categorização e acesso controlado.',
  },
  {
    icon: <Bell size={22} />,
    title: 'Comunicados',
    desc: 'Sistema de notificações e comunicados internos para manter todos os membros informados e alinhados.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Segurança & Auditoria',
    desc: 'Autenticação protegida, controlo de acessos por perfil e registo completo de todas as ações no sistema.',
  },
];

const FeaturesSection = () => (
  <section id="features" className="bg-gray-50 py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#1a2f5e]/10 text-[#1a2f5e] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
          <Zap size={12} /> Funcionalidades
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0f1f42] mb-4">
          Tudo o que precisa, num só lugar
        </h2>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Uma plataforma completa, moderna e intuitiva para a gestão eficiente do seu sindicato.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-yellow-400/50 transition-all duration-300 cursor-default"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a2f5e] text-white mb-4 group-hover:bg-yellow-400 group-hover:text-[#0f1f42] transition-colors duration-300">
              {f.icon}
            </div>
            <h3 className="font-bold text-[#0f1f42] text-base mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── BENEFITS ───────────────────────────────────────────────────────────────
const benefits = [
  'Acesso em qualquer dispositivo',
  'Dados seguros e encriptados',
  'Relatórios em tempo real',
  'Exportação PDF e impressão',
  'Gestão de múltiplos perfis',
  'Suporte a QR Code dinâmico',
  'Histórico completo de quotas',
  'Interface simples e intuitiva',
];

const BenefitsSection = ({ configs }) => (
  <section id="about" className="bg-white py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left: text + checklist */}
        <div>
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            <Award size={12} /> Vantagens
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f1f42] mb-4 leading-tight">
            Gestão sindical moderna e eficiente
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            O {configs?.sigla || 'SF-DGCI'} foi desenvolvido especificamente para as necessidades do sindicato dos
            funcionários da Direção Geral das Contribuições e Impostos da Guiné-Bissau,
            garantindo conformidade e eficiência administrativa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#1a2f5e] text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#0f1f42] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Começar agora <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right: Actual system card replica */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Floating badge top-right */}
            <div className="absolute -top-3 -right-3 z-10 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
              ✓ Digital
            </div>
            {/* Floating badge bottom-left */}
            <div className="absolute -bottom-3 -left-3 z-10 bg-yellow-400 text-[#0f1f42] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
              QR Code
            </div>

            {/* ── Actual Card (front face replica) ── */}
            <div
              className="w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              style={{ background: 'linear-gradient(135deg, #f7faff 0%, #edf4ff 100%)' }}
            >
              {/* Navy header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: '#0b1f4e' }}
              >
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow">
                  <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <p className="text-white text-[9px] font-black tracking-widest uppercase leading-tight">
                    {configs?.nome_sindicato ? configs.nome_sindicato.split(' - ')[0] : 'Sindicato dos Funcionários da'}
                  </p>
                  <p className="text-white text-[9px] font-black tracking-widest uppercase leading-tight">
                    {configs?.nome_sindicato && configs.nome_sindicato.includes(' - ') ? configs.nome_sindicato.split(' - ')[1] : 'Direção-Geral das Contribuições e Impostos'}
                  </p>
                </div>
              </div>

              {/* "CARTÃO DE MEMBRO" title */}
              <div className="text-center py-2">
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-[#0b1f4e]">
                  Cartão de Membro
                </p>
              </div>

              {/* Body: photo + info grid */}
              <div className="flex gap-3 px-4 pb-3">
                {/* Photo */}
                <div
                  className="w-[72px] h-[92px] rounded-xl flex-shrink-0 flex items-center justify-center border border-[#cfd9ee]"
                  style={{ background: '#f3f6ff' }}
                >
                  <Users size={26} className="text-[#1a2f5e]/30" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1.5 pt-1">
                  {[
                    { label: 'Nome', wide: true, gold: false },
                    { label: 'Função', wide: false, gold: false },
                    { label: 'Serviço', wide: false, gold: false },
                    { label: 'Fundo Social', wide: false, gold: false },
                    { label: 'Validade', wide: false, gold: false },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-[#1f3f7e]">{f.label}</p>
                      <div
                        className={`h-2.5 rounded mt-0.5 ${f.wide ? 'w-28' : 'w-20'}`}
                        style={{ background: '#cbd5e1' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navy footer with member number */}
              <div
                className="flex items-center px-4 py-2.5"
                style={{ background: '#0b1f4e' }}
              >
                <span className="text-[9px] font-semibold text-white/70 uppercase tracking-widest mr-2">
                  Nº de Membro:
                </span>
                <span className="text-sm font-black text-white tracking-widest">
                  SF-0042
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── CTA SECTION ────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1f42 0%, #1a2f5e 100%)' }}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-96 h-96 rounded-full border border-white/5" />
      <div className="absolute w-64 h-64 rounded-full border border-white/5" />
    </div>
    <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
      <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
        <Globe size={12} /> Acesso Imediato
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
        Pronto para entrar no sistema?
      </h2>
      <p className="text-slate-300 text-base mb-10 max-w-lg mx-auto">
        Aceda ao painel de gestão com as suas credenciais institucionais e gerencie o sindicato de forma eficiente.
      </p>
      <Link
        to="/login"
        className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#0f1f42] font-black text-base px-10 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-400/30 hover:scale-105"
      >
        Entrar no Sistema <ArrowRight size={18} />
      </Link>
    </div>
  </section>
);

// ─── FOOTER ─────────────────────────────────────────────────────────────────
const Footer = ({ configs }) => (
  <footer id="contact" style={{ background: '#0a1628' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Column 1: Logo + description */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400/40" />
            <div>
              <p className="text-white font-black text-sm">{configs?.sigla || 'SF-DGCI'}</p>
              <p className="text-slate-500 text-[10px]">Sistema de Gestão Sindical</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Plataforma oficial do {configs?.nome_sindicato || 'Sindicato dos Funcionários da Direção Geral das Contribuições e Impostos'} da Guiné-Bissau.
          </p>
        </div>

        {/* Column 2: Contact */}
        <div>
          <h4 className="text-white font-bold text-sm mb-5 uppercase tracking-wider">Contacto</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm">
              <MapPin size={14} className="text-yellow-400 flex-shrink-0" />
              {configs?.sede || 'Av. João Bernardo Vieira, Edificio da DGCI, Bissau - Guiné-Bissau'}
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-sm">
              <Mail size={14} className="text-yellow-400 flex-shrink-0" />
              {configs?.email || 'sf-dgci@dgci.mef.gw'}
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 text-sm">
              <Phone size={14} className="text-yellow-400 flex-shrink-0" />
              {configs?.telefone || '+245 955 371 498'}
            </div>
          </div>
        </div>

        {/* Column 3: Quick links */}
        <div>
          <h4 className="text-white font-bold text-sm mb-5 uppercase tracking-wider">Acesso Rápido</h4>
          <div className="space-y-2.5">
            {[
              { label: 'Entrar no Sistema', to: '/login' },
              { label: 'Gestão de Membros', to: '/login' },
              { label: 'Controlo Financeiro', to: '/login' },
              { label: 'Documentos', to: '/login' },
              { label: 'Comunicados', to: '/login' },
            ].map((l) => (
              <div key={l.label}>
                <Link
                  to={l.to}
                  className="text-slate-400 text-sm hover:text-yellow-400 transition-colors duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight size={12} /> {l.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} SF-DGCI — Todos os direitos reservados
        </p>
        <p className="text-slate-600 text-xs">
          República da Guiné-Bissau • Ministério das Finanças
        </p>
      </div>
    </div>
  </footer>
);

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [configs, setConfigs] = useState({
    nome_sindicato: 'Sindicato dos Funcionários da DGCI',
    sigla: 'SF-DGCI',
    sede: 'Av. João Bernardo Vieira, Edificio da DGCI, Bissau - Guiné-Bissau',
    telefone: '+245 955 371 498',
    email: 'sf-dgci@dgci.mef.gw',
    website: ''
  });

  useEffect(() => {
    axios.get('/api/configuracoes/public')
      .then(res => {
        if (res.data && res.data.success) {
          setConfigs(prev => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(err => console.error('Erro ao buscar configuracoes publicas:', err));
  }, []);

  return (
    <div className="font-sans antialiased">
      <Navbar configs={configs} />
      <Hero configs={configs} />
      <FeaturesSection />
      <BenefitsSection configs={configs} />
      <CTASection />
      <Footer configs={configs} />
    </div>
  );
};

export default LandingPage;
