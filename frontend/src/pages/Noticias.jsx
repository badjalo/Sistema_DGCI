import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBackendUrl } from '../services/api';
import {
    ArrowRight, Calendar, Clock, Tag, ChevronLeft, ChevronRight,
    Search, Filter, Heart, MessageCircle, Share2, Menu, X, Lock
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicNavbar from '../components/PublicNavbar';



// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = () => (
    <section className="relative min-h-[400px] flex flex-col justify-center overflow-hidden pt-20">
        {/* Background gradient */}
        <div
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(135deg, #0f1f42 0%, #1a2f5e 100%)' }}
        />

        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full border border-white/5 z-0" />
        <div className="absolute bottom-40 left-10 w-56 h-56 rounded-full border border-white/5 z-0" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 max-w-4xl mx-auto">
                Notícias e <span className="text-[#facc15]">Comunicados</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
                Mantenha-se informado sobre todas as atualizações, eventos e comunicados importantes do sindicato.
            </p>
        </div>
    </section>
);

// ─── NEWS GRID ───────────────────────────────────────────────────────────────
// ─── NEWS GRID ───────────────────────────────────────────────────────────────
const NewsGrid = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNews, setSelectedNews] = useState(null);
    const [likedIds, setLikedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('sf_liked_news') || '[]'); }
        catch { return []; }
    });
    const [likeCounts, setLikeCounts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('sf_like_counts') || '{}'); }
        catch { return {}; }
    });

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/comunicados/publicos');
            if (response.data.success && response.data.data) {
                const BACKEND = getBackendUrl();
                const buildImgUrl = (url) => {
                    if (!url) return null;
                    if (url.startsWith('http')) return url;
                    return `${BACKEND}${url}`;
                };
                const newsData = response.data.data.map(item => ({
                    id: item.id,
                    title: item.titulo,
                    excerpt: item.conteudo?.substring(0, 100) + '...' || 'Sem descrição',
                    content: item.conteudo || '',
                    category: mapCategory(item.tipo),
                    tipo: item.tipo,
                    date: item.data_publicacao || item.criado_em,
                    author: item.autor_nome || 'Administração',
                    foto_url: buildImgUrl(item.foto_url),
                    nome_falecido: item.nome_falecido || null,
                    comments: 0,
                    featured: item.urgente === true,
                }));
                setNews(newsData);
            }
        } catch (error) {
            console.error('Erro ao carregar notícias:', error);
        } finally {
            setLoading(false);
        }
    };

    const mapCategory = (tipo) => {
        const categoryMap = {
            'aviso': 'Aviso',
            'circular': 'Circular',
            'convocatoria': 'Convocação',
            'informacao': 'Informação',
            'urgente': 'Urgente',
            'obito': 'Óbito',
        };
        return categoryMap[tipo] || tipo;
    };

    const getCategoryStyle = (tipo) => {
        const m = {
            aviso: 'bg-orange-100 text-orange-700',
            circular: 'bg-blue-100 text-blue-700',
            convocatoria: 'bg-purple-100 text-purple-700',
            informacao: 'bg-blue-100 text-blue-700',
            urgente: 'bg-red-100 text-red-600',
            obito: 'bg-gray-200 text-gray-700',
        };
        return m[tipo] || 'bg-yellow-100 text-yellow-700';
    };

    const categories = ['Todas', 'Aviso', 'Circular', 'Convocação', 'Informação', 'Urgente', 'Óbito'];

    const filteredNews = news.filter((item) => {
        const matchesCategory = filter === 'Todas' || item.category === filter;
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredNews = filteredNews.filter((n) => n.featured);
    const regularNews = filteredNews.filter((n) => !n.featured);

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

    const formatDate = (dateString) => {
        if (!dateString) return 'Data não disponível';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const cleaned = String(dateString).replace(/\+\d{2}$/, ':00');
                const date2 = new Date(cleaned);
                if (isNaN(date2.getTime())) return 'N/A';
                return date2.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            return date.toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch (error) {
            return 'N/A';
        }
    };

    return (
        <section className="bg-gray-50 dark:bg-[#0d1117] py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search & Filter */}
                <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Search */}
                        <div className="md:col-span-2 relative">
                            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Procurar notícias..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <Filter size={18} className="absolute left-3.5 top-3 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 cursor-pointer"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category pills */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${filter === cat
                                    ? 'bg-[#1a2f5e] text-white'
                                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-[#1a2f5e] dark:hover:border-blue-500'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-12">
                        {/* Featured News Skeleton */}
                        <div>
                            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map((n) => (
                                    <div key={n} className="bg-white dark:bg-[#161b27] border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
                                        <div className="w-full h-44 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                                        <div className="h-4 w-1/4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Regular News Skeleton */}
                        <div>
                            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={n} className="bg-white dark:bg-[#161b27] border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex gap-4">
                                        <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse flex-shrink-0"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 w-1/4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                            <div className="h-5 w-3/4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                            <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Featured News */}
                        {featuredNews.length > 0 && (
                            <div className="mb-16">
                                <h2 className="text-2xl font-black text-[#0f1f42] dark:text-white mb-8">Em Destaque</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {featuredNews.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedNews(item)}
                                            className="group bg-white dark:bg-[#161b27] border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 dark:hover:border-yellow-400/30 transition-all duration-300 cursor-pointer"
                                        >
                                            {/* Imagem de capa */}
                                            {item.foto_url ? (
                                                <div className="relative w-full h-44 overflow-hidden bg-gray-100">
                                                    <img
                                                        src={item.foto_url}
                                                        alt={item.nome_falecido || item.title}
                                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                                                            item.tipo === 'obito' ? 'filter grayscale' : ''
                                                        }`}
                                                        onError={(e) => { e.target.parentElement.style.display='none'; }}
                                                    />
                                                    {item.tipo === 'obito' && (
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-4">
                                                            <p className="text-white text-sm font-semibold italic">Em memória de: {item.nome_falecido}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`w-full h-32 flex items-center justify-center ${
                                                    item.tipo === 'obito'
                                                        ? 'bg-gradient-to-br from-gray-200 to-gray-300'
                                                        : 'bg-gradient-to-br from-[#1a2f5e]/10 to-yellow-400/10'
                                                }`}>
                                                    <Tag size={32} className={item.tipo === 'obito' ? 'text-gray-400' : 'text-[#1a2f5e]/30'} />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-wide rounded-md ${getCategoryStyle(item.tipo)}`}>
                                                        {item.tipo === 'obito' ? '⚰️ ' : ''}{item.category}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Calendar size={12} /> {formatDate(item.date)}
                                                    </span>
                                                </div>
                                                <h3 className={`text-lg font-bold mb-2 transition-colors ${
                                                    item.tipo === 'obito'
                                                        ? 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                                        : 'text-[#0f1f42] dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                                                }`}>
                                                    {item.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{item.excerpt}</p>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                        <button
                                                            onClick={(e) => toggleLike(e, item.id)}
                                                            className={`flex items-center gap-1.5 font-semibold transition-all duration-200 ${likedIds.includes(item.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                                                            title={likedIds.includes(item.id) ? 'Remover curtida' : 'Curtir'}
                                                        >
                                                            <Heart size={14} className={likedIds.includes(item.id) ? 'fill-red-500 text-red-500' : ''} />
                                                            {likeCounts[item.id] || 0}
                                                        </button>
                                                        <span className="flex items-center gap-1">
                                                            <MessageCircle size={14} /> {item.comments}
                                                        </span>
                                                    </div>
                                                    <button className="text-yellow-600 hover:text-yellow-700 transition-colors">
                                                        <Share2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular News List */}
                        {regularNews.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-black text-[#0f1f42] dark:text-white mb-8">Todas as Notícias</h2>
                                <div className="space-y-4">
                                    {regularNews.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedNews(item)}
                                            className={`group bg-white dark:bg-[#161b27] border rounded-xl p-6 hover:shadow-md transition-all duration-300 cursor-pointer flex gap-4 ${
                                                item.tipo === 'obito'
                                                    ? 'border-gray-300 dark:border-slate-700 hover:border-gray-500 dark:hover:border-gray-500'
                                                    : 'border-gray-100 dark:border-slate-800 hover:border-yellow-400/50 dark:hover:border-yellow-400/30'
                                            }`}
                                        >
                                            {/* Imagem / Icon */}
                                            {item.foto_url ? (
                                                <div className="flex-shrink-0 relative">
                                                    <img
                                                        src={item.foto_url}
                                                        alt={item.nome_falecido || item.title}
                                                        className={`w-20 h-20 rounded-xl object-cover ring-2 ${
                                                            item.tipo === 'obito'
                                                                ? 'ring-gray-300 filter grayscale'
                                                                : 'ring-yellow-200'
                                                        }`}
                                                        onError={(e) => { e.target.parentElement.style.display='none'; }}
                                                    />
                                                    {item.tipo === 'obito' && (
                                                        <span className="absolute -bottom-1 -right-1 text-base">⚰️</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    item.tipo === 'obito'
                                                        ? 'bg-gray-100'
                                                        : 'bg-gradient-to-br from-[#1a2f5e]/10 to-yellow-400/10'
                                                }`}>
                                                    <Tag size={24} className={item.tipo === 'obito' ? 'text-gray-400' : 'text-[#1a2f5e]/50'} />
                                                </div>
                                            )}

                                            {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-wide rounded-md ${getCategoryStyle(item.tipo)}`}>
                                                        {item.tipo === 'obito' ? '⛰️ ' : ''}{item.category}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Calendar size={12} /> {formatDate(item.date)}
                                                    </span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.author}</span>
                                                </div>
                                                <h3 className={`text-base font-bold mb-1 transition-colors ${
                                                    item.tipo === 'obito'
                                                        ? 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                                        : 'text-[#0f1f42] dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                                                }`}>
                                                    {item.title}
                                                </h3>
                                                {item.tipo === 'obito' && item.nome_falecido && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-1">Em memória de: <strong>{item.nome_falecido}</strong></p>
                                                )}
                                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{item.excerpt}</p>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                                                <button
                                                    onClick={(e) => toggleLike(e, item.id)}
                                                    className={`flex items-center gap-1.5 font-semibold transition-all duration-200 ${likedIds.includes(item.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                                                    title={likedIds.includes(item.id) ? 'Remover curtida' : 'Curtir'}
                                                >
                                                    <Heart size={14} className={likedIds.includes(item.id) ? 'fill-red-500 text-red-500' : ''} />
                                                    {likeCounts[item.id] || 0}
                                                </button>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle size={14} /> {item.comments}
                                                </span>
                                            </div>

                                            <ChevronRight size={18} className={`flex-shrink-0 ${
                                                item.tipo === 'obito' ? 'text-gray-300 group-hover:text-gray-500' : 'text-gray-300 group-hover:text-yellow-400'
                                            }`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {filteredNews.length === 0 && (
                            <div className="text-center py-16">
                                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma notícia encontrada</h3>
                                <p className="text-gray-500">Tente ajustar seus filtros ou termos de pesquisa.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Modal para ver notícia completa */}
                {selectedNews && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#161b27] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className={`sticky top-0 p-6 text-white flex items-center justify-between ${
                                selectedNews.tipo === 'obito'
                                    ? 'bg-gradient-to-r from-gray-700 to-gray-900'
                                    : 'bg-gradient-to-r from-[#1a2f5e] to-[#0f1f42]'
                            }`}>
                                <div>
                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold tracking-wide rounded-md ${getCategoryStyle(selectedNews.tipo)} mb-2`}>
                                        {selectedNews.tipo === 'obito' ? '⚰️ ' : ''}{selectedNews.category}
                                    </span>
                                    <h2 className="text-2xl font-black">{selectedNews.title}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Foto do falecido no modal */}
                            {selectedNews.tipo === 'obito' && (selectedNews.foto_url || selectedNews.nome_falecido) && (
                                <div className="flex items-center gap-5 px-6 py-5 bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-slate-800">
                                    {selectedNews.foto_url ? (
                                        <img
                                            src={selectedNews.foto_url}
                                            alt={selectedNews.nome_falecido || 'Falecido'}
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-300 dark:ring-slate-700 shadow-md flex-shrink-0"
                                            onError={(e) => { e.target.style.display='none'; }}
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ring-4 ring-gray-300 dark:ring-slate-700">
                                            <span className="text-3xl">🕊️</span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold mb-1">Em memória de</p>
                                        <p className="text-xl font-black text-gray-800 dark:text-white">{selectedNews.nome_falecido || '—'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">Que descanse em paz</p>
                                    </div>
                                </div>
                            )}

                            {/* Foto para notícias normais no modal */}
                            {selectedNews.tipo !== 'obito' && selectedNews.foto_url && (
                                <div className="w-full h-64 overflow-hidden bg-gray-100 border-b border-gray-200">
                                    <img
                                        src={selectedNews.foto_url}
                                        alt={selectedNews.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.parentElement.style.display='none'; }}
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-slate-800">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> {formatDate(selectedNews.date)}
                                    </span>
                                    <span>•</span>
                                    <span>{selectedNews.author}</span>
                                </div>

                                <div className="prose max-w-none">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedNews.content}
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-gray-50 dark:bg-[#0d1117] p-6 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="text-xs text-gray-500 flex items-center gap-4">
                                    <button
                                        onClick={(e) => toggleLike(e, selectedNews.id)}
                                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${likedIds.includes(selectedNews.id) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                                    >
                                        <Heart size={15} className={likedIds.includes(selectedNews.id) ? 'fill-red-500 text-red-500' : ''} />
                                        {likedIds.includes(selectedNews.id) ? 'Curtido' : 'Curtir'} · {likeCounts[selectedNews.id] || 0}
                                    </button>
                                    <span className="flex items-center gap-1 text-sm">
                                        <MessageCircle size={14} /> {selectedNews.comments} comentários
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="bg-[#1a2f5e] hover:bg-[#0f1f42] text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── FOOTER ─────────────────────────────────────────────────────────────────
const Footer = () => (
    <footer style={{ background: '#0a1628' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <p className="text-slate-500 text-xs mb-1">
                © {new Date().getFullYear()} SF-DGCI — Todos os direitos reservados
            </p>
            <p className="text-slate-500 text-xs">
                República da Guiné-Bissau • Ministério das Finanças
            </p>
        </div>
    </footer>
);

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
const Noticias = () => {
    return (
        <div className="font-sans antialiased bg-white dark:bg-[#0d1117] text-slate-800 dark:text-[#e6edf4] transition-colors duration-200">
            <PublicNavbar />
            <HeroSection />
            <NewsGrid />
            <Footer />
        </div>
    );
};

export default Noticias;
