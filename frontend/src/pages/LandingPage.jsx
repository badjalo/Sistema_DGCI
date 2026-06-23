import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getBackendUrl } from '../services/api';
import {
  Star, Shield, Users, FileText, CreditCard, BarChart3,
  Bell, Settings, CheckCircle, ArrowRight, Menu, X,
  Building2, Phone, Mail, MapPin, Zap, Lock, Globe, Award, Calendar, Heart, Tag, Download
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicNavbar from '../components/PublicNavbar';

// ─── ANIMATED COUNTER HOOK ───────────────────────────────────────────────────
const useCountUp = (target, duration = 1800, enabled = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || typeof target !== 'number') return;
    if (target === 0) { setCount(0); return; }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return count;
};

// ─── ANIMATED STAT ITEM ──────────────────────────────────────────────────────
const AnimatedStat = ({ rawValue, label, enabled }) => {
  const isNumeric = typeof rawValue === 'number';
  const animated = useCountUp(isNumeric ? rawValue : 0, 1800, enabled && isNumeric);
  const displayValue = isNumeric ? animated.toLocaleString('pt-PT') : rawValue;
  return (
    <div className="border border-white/15 bg-white/5 backdrop-blur-sm rounded-xl px-2 py-3 text-center flex flex-col items-center justify-center min-w-0">
      <p className="text-sm sm:text-base font-black text-yellow-400 leading-tight break-words w-full tabular-nums">
        {displayValue}
      </p>
      <p className="text-slate-400 text-[10px] mt-1 font-medium leading-tight">{label}</p>
    </div>
  );
};




// ─── HERO ───────────────────────────────────────────────────────────────────
const Hero = ({ configs }) => {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const rawStats = [
    { rawValue: configs?.stats?.totalMembros ?? 0, label: 'Membros Registados' },
    { rawValue: configs?.stats?.totalFundoSocial ?? 0, label: 'No Fundo Social' },
    {
      rawValue: new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(configs?.stats?.totalReceita ?? 0),
      label: 'Total de Receita'
    },
    {
      rawValue: new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(configs?.stats?.totalDespesa ?? 0),
      label: 'Total de Despesa'
    },
    {
      rawValue: new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(configs?.stats?.saldoDisponivel ?? 0),
      label: 'Saldo Disponível'
    },
    { rawValue: '100%', label: 'Seguro & Digital' },
  ];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
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
        </div>

        {/* Animated stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full max-w-5xl">
          {rawStats.map((s) => (
            <AnimatedStat key={s.label} rawValue={s.rawValue} label={s.label} enabled={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};



// ─── NEWS SECTION ───────────────────────────────────────────────────────────
const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_liked_news') || '[]'); }
    catch { return []; }
  });
  const [likeCounts, setLikeCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_like_counts') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const response = await api.get('/comunicados/publicos');
      if (response.data.success && response.data.data) {
        const BACKEND = getBackendUrl();
        const buildImgUrl = (url) => {
          if (!url) return null;
          if (url.startsWith('http')) return url;
          return `${BACKEND}${url}`;
        };
        const newsData = response.data.data.slice(0, 3).map(item => ({
          id: item.id,
          title: item.titulo,
          excerpt: item.conteudo?.substring(0, 120) + '...' || 'Sem descrição',
          content: item.conteudo || 'Sem conteúdo disponível',
          category: mapCategory(item.tipo),
          tipo: item.tipo,
          date: item.data_publicacao || item.criado_em,
          author: item.autor_nome || 'Administração',
          foto_url: buildImgUrl(item.foto_url),
          nome_falecido: item.nome_falecido || null,
        }));
        setNews(newsData);
      }
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const mapCategory = (tipo) => {
    const m = { aviso: 'Aviso', circular: 'Circular', convocatoria: 'Convocação', informacao: 'Informação', urgente: 'Urgente' };
    return m[tipo] || tipo;
  };

  const getCategoryStyle = (tipo) => {
    const m = { aviso: 'bg-orange-100 text-orange-700', circular: 'bg-blue-100 text-blue-700', convocatoria: 'bg-purple-100 text-purple-700', informacao: 'bg-blue-100 text-blue-700', urgente: 'bg-red-100 text-red-600' };
    return m[tipo] || 'bg-yellow-100 text-yellow-700';
  };

  const getBarColor = (tipo) => {
    const m = { urgente: 'bg-red-500', informacao: 'bg-blue-500', circular: 'bg-blue-500', aviso: 'bg-orange-400', convocatoria: 'bg-purple-500' };
    return m[tipo] || 'bg-yellow-400';
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  const toggleLike = (e, id) => {
    e.stopPropagation();
    const isLiked = likedIds.includes(id);
    const newLiked = isLiked ? likedIds.filter(x => x !== id) : [...likedIds, id];
    const newCounts = { ...likeCounts, [id]: Math.max(0, (likeCounts[id] || 0) + (isLiked ? -1 : 1)) };
    setLikedIds(newLiked);
    setLikeCounts(newCounts);
    localStorage.setItem('sf_liked_news', JSON.stringify(newLiked));
    localStorage.setItem('sf_like_counts', JSON.stringify(newCounts));
  };

  return (
    <section id="news" className="py-24 bg-white dark:bg-[#0d1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full mb-3 tracking-widest uppercase">
              <Bell size={12} /> Últimas Notícias
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f1f42] dark:text-white">Mantenha-se Informado</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md">Acompanhe os comunicados e eventos do sindicato.</p>
          </div>
          <Link to="/noticias" className="inline-flex items-center gap-2 text-[#1a2f5e] font-bold text-sm hover:text-yellow-600 transition-colors whitespace-nowrap">
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingNews ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2f5e] mx-auto" />
              <p className="text-gray-500 mt-3 text-sm">A carregar notícias...</p>
            </div>
          ) : news.length > 0 ? news.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNews(item)}
              className="group bg-white dark:bg-[#161b27] border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className={`h-1.5 w-full ${getBarColor(item.tipo)}`} />
              {/* Imagem de capa ou placeholder */}
              {item.foto_url ? (
                <div className="relative w-full h-36 overflow-hidden bg-gray-100">
                  <img
                    src={item.foto_url}
                    alt={item.nome_falecido || item.title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      item.tipo === 'obito' ? 'filter grayscale' : ''
                    }`}
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                  />
                  {item.tipo === 'obito' && item.nome_falecido && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-3">
                      <p className="text-white text-xs font-semibold italic">Em memória de: {item.nome_falecido}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#1a2f5e]/4 to-yellow-400/4 h-20 flex items-center justify-center border-b border-gray-100/30 dark:border-slate-800/30">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100/50 dark:border-slate-700 group-hover:scale-105 transition-transform duration-300">
                    <Tag size={18} className="text-[#1a2f5e]/40 dark:text-blue-400/60" />
                  </div>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-wide rounded-md ${getCategoryStyle(item.tipo)}`}>{item.category}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1"><Calendar size={10} />{formatDate(item.date)}</span>
                </div>
                <h3 className="text-sm font-bold text-[#0f1f42] dark:text-white mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">{item.excerpt}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate mr-2">{item.author}</span>
                  <button
                    onClick={(e) => toggleLike(e, item.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-200 ${likedIds.includes(item.id) ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                  >
                    <Heart size={13} className={likedIds.includes(item.id) ? 'fill-red-500 text-red-500' : ''} />
                    {likeCounts[item.id] || 0}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-sm">Nenhuma notícia disponível no momento.</p>
            </div>
          )}
        </div>

        {selectedNews && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNews(null)}>
            <div className="bg-white dark:bg-[#161b27] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className={`h-2 w-full rounded-t-2xl ${getBarColor(selectedNews.tipo)}`} />
              <div className="sticky top-0 bg-gradient-to-r from-[#1a2f5e] to-[#0f1f42] p-6 text-white flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${getCategoryStyle(selectedNews.tipo)}`}>{selectedNews.category}</span>
                  <h2 className="text-xl font-black leading-tight">{selectedNews.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(selectedNews.date)}</span>
                    <span>•</span><span>{selectedNews.author}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedNews(null)} className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0 text-lg">✕</button>
              </div>

              {/* Imagem de destaque no modal */}
              {selectedNews.foto_url && (
                <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-slate-800">
                  <img
                    src={selectedNews.foto_url}
                    alt={selectedNews.nome_falecido || selectedNews.title}
                    className={`w-full max-h-72 object-cover ${selectedNews.tipo === 'obito' ? 'filter grayscale' : ''}`}
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                  />
                  {selectedNews.tipo === 'obito' && selectedNews.nome_falecido && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent flex items-end p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-semibold italic">
                          Em memória de: <strong>{selectedNews.nome_falecido}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{selectedNews.content}</p>
              </div>
              <div className="sticky bottom-0 bg-gray-50 dark:bg-[#0d1117] p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between rounded-b-2xl">
                <button
                  onClick={(e) => toggleLike(e, selectedNews.id)}
                  className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${likedIds.includes(selectedNews.id) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                >
                  <Heart size={15} className={likedIds.includes(selectedNews.id) ? 'fill-red-500 text-red-500' : ''} />
                  {likedIds.includes(selectedNews.id) ? 'Curtido' : 'Curtir'} · {likeCounts[selectedNews.id] || 0}
                </button>
                <button onClick={() => setSelectedNews(null)} className="bg-[#1a2f5e] hover:bg-[#0f1f42] text-white font-bold py-2 px-5 rounded-lg transition-all text-sm">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── DOCUMENTS SECTION ──────────────────────────────────────────────────────
const DocumentsSection = () => {
  const [latestDocuments, setLatestDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    fetchLatestDocuments();
  }, []);

  const categoryDisplayMap = {
    'geral': 'Geral',
    'ata': 'Ata de Reunião',
    'estatuto': 'Estatuto',
    'contrato': 'Contrato',
    'circular': 'Circular',
    'relatorio': 'Relatório',
    'declaracao': 'Declaração',
    'outro': 'Outro',
  };

  const fetchLatestDocuments = async () => {
    try {
      const response = await api.get('/documentos/publicos');
      if (response.data.success && response.data.data) {
        const docs = response.data.data
          .map(doc => ({
            id: doc.id,
            name: doc.titulo,
            ficheiro_nome: doc.ficheiro_nome,
            category: categoryDisplayMap[doc.tipo] || doc.tipo,
            type: doc.ficheiro_nome?.split('.').pop()?.toLowerCase() || 'file',
            size: formatFileSize(doc.ficheiro_tamanho),
            uploadDate: doc.criado_em || new Date().toISOString(),
            description: doc.titulo,
            url: doc.ficheiro_url,
          }))
          .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
          .slice(0, 3);
        setLatestDocuments(docs);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const cleaned = String(dateString).replace(/\+\d{2}$/, ':00');
        const date2 = new Date(cleaned);
        if (isNaN(date2.getTime())) return 'N/A';
        return date2.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return date.toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="size-6 text-red-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="size-6 text-green-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="size-6 text-blue-500" />;
      default:
        return <FileText className="size-6 text-gray-500" />;
    }
  };

  return (
    <section id="documents" className="py-24 bg-gradient-to-b from-gray-50 dark:from-[#161b27] to-white dark:to-[#0d1117]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full mb-3 tracking-widest uppercase">
              <Download size={12} /> Biblioteca Digital
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f1f42] dark:text-white">Documentos Recentes</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-md">Aceda rapidamente aos estatutos, atas e circulares oficiais do sindicato.</p>
          </div>
          <Link to="/documentos-publicos" className="inline-flex items-center gap-2 text-[#1a2f5e] font-bold text-sm hover:text-yellow-600 transition-colors whitespace-nowrap">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loadingDocs ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a2f5e] mx-auto" />
              <p className="text-gray-500 mt-3 text-sm">A carregar documentos...</p>
            </div>
          ) : latestDocuments.length > 0 ? (
            latestDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white dark:bg-[#161b27] border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="bg-gradient-to-br from-[#1a2f5e]/8 to-yellow-400/8 p-6 flex items-start justify-between">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100/50 dark:border-slate-700">
                    {getFileIcon(doc.type)}
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-yellow-400/10 text-yellow-800 text-[10px] font-bold rounded-full">
                    {doc.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-[#0f1f42] dark:text-white mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug">
                    {doc.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {doc.description || 'Sem descrição adicional.'}
                  </p>

                  <div className="space-y-2 text-[11px] text-gray-400 dark:text-gray-500 mb-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>Tamanho: <strong className="text-gray-600 dark:text-gray-300">{doc.size}</strong></span>
                      <span>Tipo: <strong className="text-gray-600 dark:text-gray-300 uppercase">{doc.type}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      <span>Publicado em: <strong className="text-gray-600">{formatDate(doc.uploadDate)}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={doc.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs shadow-sm hover:shadow-yellow-500/20"
                    >
                      <FileText size={13} />
                      Ler
                    </a>
                    <a
                      href={doc.url || '#'}
                      download={doc.ficheiro_nome || doc.name}
                      className="flex-1 bg-[#1a2f5e] hover:bg-[#0f1f42] text-white font-bold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs shadow-sm hover:shadow-[#1a2f5e]/20"
                    >
                      <Download size={13} />
                      Baixar
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-sm">Nenhum documento disponível no momento.</p>
            </div>
          )}
        </div>

        {/* CTA to all documents */}
        <div className="text-center">
          <Link
            to="/documentos-publicos"
            className="inline-flex items-center gap-2 bg-[#1a2f5e]/10 border border-[#1a2f5e]/20 text-[#1a2f5e] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#1a2f5e] hover:text-white transition-all duration-200"
          >
            Ver Todos os Documentos <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

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
              { label: 'O Sindicato', to: '/sindicato' },
              { label: 'Notícias', to: '/noticias' },
              { label: 'Documentos Públicos', to: '/documentos-publicos' },
              { label: 'Entrar no Sistema', to: '/login' },
              { label: 'Controlo Financeiro', to: '/login' },
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
    api.get('/configuracoes/public')
      .then(res => {
        if (res.data && res.data.success) {
          setConfigs(prev => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(err => console.error('Erro ao buscar configuracoes publicas:', err));
  }, []);

  return (
    <div className="font-sans antialiased bg-white dark:bg-[#0d1117] text-slate-800 dark:text-[#e6edf4] transition-colors duration-200">
      <PublicNavbar />

      <Hero configs={configs} />
      <NewsSection />
      <DocumentsSection />
      <CTASection />
      <Footer configs={configs} />
    </div>
  );
};

export default LandingPage;
