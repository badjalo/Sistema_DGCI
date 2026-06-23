import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBackendUrl } from '../services/api';
import {
    ArrowRight, Calendar, ChevronLeft, Search, Filter, Download,
    File, FileText, Image, Music, Video, Archive, Menu, X, Lock
} from 'lucide-react';
import logo from '../assets/logo.png';
import PublicNavbar from '../components/PublicNavbar';



// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = () => (
    <section className="relative min-h-[350px] flex flex-col justify-center overflow-hidden pt-20">
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
                Biblioteca de <span className="text-[#facc15]">Documentos</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
                Aceda a todos os documentos, regulamentos e arquivos disponibilizados pelo sindicato.
            </p>
        </div>
    </section>
);

// ─── FILE TYPE ICON ─────────────────────────────────────────────────────────
const FileIcon = ({ type }) => {
    const iconClass = 'size-6';
    switch (type) {
        case 'pdf':
            return <FileText className={`${iconClass} text-red-500`} />;
        case 'doc':
        case 'docx':
            return <FileText className={`${iconClass} text-blue-500`} />;
        case 'xls':
        case 'xlsx':
            return <FileText className={`${iconClass} text-green-500`} />;
        case 'image':
            return <Image className={`${iconClass} text-purple-500`} />;
        case 'video':
            return <Video className={`${iconClass} text-pink-500`} />;
        case 'audio':
            return <Music className={`${iconClass} text-orange-500`} />;
        case 'archive':
            return <Archive className={`${iconClass} text-yellow-600`} />;
        default:
            return <File className={`${iconClass} text-gray-500`} />;
    }
};

// ─── DOCUMENTS GRID ──────────────────────────────────────────────────────────
const DocumentsGrid = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Mapeamento de tipo BD → nome de exibição
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

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/documentos/publicos');
            if (response.data.success && response.data.data) {
                const docs = response.data.data.map(doc => ({
                    id: doc.id,
                    name: doc.titulo,
                    ficheiro_nome: doc.ficheiro_nome,
                    category: categoryDisplayMap[doc.tipo] || doc.tipo,
                    tipo: doc.tipo,
                    type: doc.ficheiro_nome?.split('.').pop()?.toLowerCase() || 'file',
                    size: formatFileSize(doc.ficheiro_tamanho),
                    uploadDate: doc.criado_em || new Date().toISOString(),
                    description: doc.titulo,
                    downloads: 0,
                    url: doc.ficheiro_url,
                }));
                console.log('Documentos carregados:', docs);
                setDocuments(docs);
            }
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const categories = ['Todos', 'Geral', 'Ata de Reunião', 'Estatuto', 'Contrato', 'Circular', 'Relatório', 'Declaração', 'Outro'];

    const filteredDocs = documents.filter((doc) => {
        const matchesCategory = filter === 'Todos' || doc.category.toLowerCase() === filter.toLowerCase();
        const matchesSearch =
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'Data não disponível';
        try {
            // Suporta formatos ISO, timestamp e strings de data
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Tentar remover sufixo de timezone problemático
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

    const handleView = (doc) => {
        if (doc.url) {
            // Usar URL relativa para passar pelo proxy do Vite (evita bloqueio CORS)
            window.open(doc.url, '_blank');
        }
    };

    const handleDownload = (doc) => {
        if (doc.url) {
            // Usar URL relativa para evitar bloqueio de download cross-origin
            const link = document.createElement('a');
            link.href = doc.url;
            // Usar o nome real do ficheiro (com extensão), não o título
            link.download = doc.ficheiro_nome || doc.name || 'documento';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <section className="bg-gray-50 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search & Filter */}
                <div className="mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Search */}
                        <div className="md:col-span-2 relative">
                            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Procurar documentos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <Filter size={18} className="absolute left-3.5 top-3 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-white cursor-pointer"
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
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-[#1a2f5e]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-16">
                            <div className="inline-block">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2f5e]"></div>
                            </div>
                            <p className="text-gray-500 mt-4">A carregar documentos...</p>
                        </div>
                    ) : filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-yellow-400/50 transition-all duration-300"
                            >
                                {/* Header with icon and category */}
                                <div className="bg-gradient-to-br from-[#1a2f5e]/10 to-yellow-400/10 p-6 flex items-start justify-between">
                                    <FileIcon type={doc.type} />
                                    <span className="inline-block px-2.5 py-0.5 bg-yellow-400/20 text-yellow-700 text-[10px] font-bold rounded-full">
                                        {doc.category}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col h-full">
                                    <h3 className="text-base font-bold text-[#0f1f42] mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                        {doc.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {doc.description}
                                    </p>

                                    {/* Metadata */}
                                    <div className="space-y-2 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                                        <div className="flex justify-between">
                                            <span>Tamanho: {doc.size}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} />
                                            <span className="font-semibold">Publicação:</span>
                                            <span>{formatDate(doc.uploadDate)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn text-sm"
                                        >
                                            <FileText size={14} className="group-hover/btn:scale-110 transition-transform" />
                                            Ler
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex-1 bg-[#1a2f5e] hover:bg-[#0f1f42] text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn text-sm"
                                        >
                                            <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
                                            Baixar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum documento encontrado</h3>
                            <p className="text-gray-500">Tente ajustar seus filtros ou termos de pesquisa.</p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
                        <p className="text-3xl font-black text-[#1a2f5e] mb-2">{documents.length}</p>
                        <p className="text-gray-600 text-sm font-semibold">Total de Documentos</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
                        <p className="text-3xl font-black text-yellow-600 mb-2">
                            {new Set(documents.map(d => d.category)).size}
                        </p>
                        <p className="text-gray-600 text-sm font-semibold">Categorias</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
                        <p className="text-3xl font-black text-green-600 mb-2">
                            {documents.length}
                        </p>
                        <p className="text-gray-600 text-sm font-semibold">Documentos Públicos</p>
                    </div>
                </div>
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
const DocumentosPublicos = () => {
    return (
        <div className="font-sans antialiased bg-white dark:bg-[#0d1117] text-slate-800 dark:text-[#e6edf4] transition-colors duration-200">
            <PublicNavbar />
            <HeroSection />
            <DocumentsGrid />
            <Footer />
        </div>
    );
};

export default DocumentosPublicos;
