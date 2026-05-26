import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import logoImg from '../../assets/logo.jpeg';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, CreditCard, Download, Printer, RefreshCw, Phone, Mail, MapPin, CheckCircle, Shield } from 'lucide-react';

const MembroCartao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardTheme, setCardTheme] = useState('executive-blue'); // executive-blue, premium-gold, charcoal-dark

  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  useEffect(() => {
    const fetchMembro = async () => {
      try {
        const { data } = await api.get(`/membros/${id}`);
        setMembro(data.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do membro');
        navigate(`/membros/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchMembro();
  }, [id, navigate]);

  useEffect(() => {
    if (membro) {
      // Dynamic verification URL
      const verifyUrl = `${window.location.origin}/membros/${membro.id}`;
      QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 150,
        color: {
          dark: '#0f2043',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code:', err));
    }
  }, [membro]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!membro) {
    return (
      <div className="text-center p-12" style={{ color: 'var(--text-3)' }}>
        Membro não encontrado.
      </div>
    );
  }

  // Calculate validity (admission date + 5 years)
  const dataAdmissao = new Date(membro.data_admissao);
  const dataValidade = new Date(dataAdmissao.getFullYear() + 5, dataAdmissao.getMonth(), dataAdmissao.getDate());
  const formattedValidade = `${String(dataValidade.getMonth() + 1).padStart(2, '0')}/${String(dataValidade.getFullYear()).slice(-2)}`;
  const formattedAdmissao = `${String(dataAdmissao.getMonth() + 1).padStart(2, '0')}/${String(dataAdmissao.getFullYear()).slice(-2)}`;

  // Theme definition
  const themes = {
    'executive-blue': {
      bg: 'linear-gradient(135deg, #0b1a30 0%, #162c55 50%, #081222 100%)',
      accentColor: '#dfba6b', // Gold
      textColor: '#ffffff',
      subTextColor: '#9bc0ff',
      labelColor: '#638ebc',
      badgeBg: 'rgba(223, 186, 107, 0.15)',
      badgeText: '#dfba6b',
    },
    'premium-gold': {
      bg: 'linear-gradient(135deg, #111111 0%, #2c2518 50%, #0a0a0a 100%)',
      accentColor: '#d4af37', // Pure Gold
      textColor: '#ffffff',
      subTextColor: '#e5c158',
      labelColor: '#8a7b5d',
      badgeBg: 'rgba(212, 175, 55, 0.2)',
      badgeText: '#ffd700',
    },
    'charcoal-dark': {
      bg: 'linear-gradient(135deg, #18191b 0%, #32353a 50%, #0d0e10 100%)',
      accentColor: '#10b981', // Emerald
      textColor: '#ffffff',
      subTextColor: '#a1a5b0',
      labelColor: '#6b7280',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeText: '#10b981',
    },
  };

  const activeTheme = themes[cardTheme] || themes['executive-blue'];

  const exportPNG = async () => {
    const t = toast.loading('A preparar ficheiros HD para exportação...');
    try {
      const originalFlip = isFlipped;
      setIsFlipped(false);

      // We capture front
      const frontCanvas = await html2canvas(cardFrontRef.current, {
        scale: 3, // High DPI
        useCORS: true,
        backgroundColor: null,
      });

      // We flip to back and capture
      setIsFlipped(true);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const backCanvas = await html2canvas(cardBackRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      setIsFlipped(originalFlip);

      const frontLink = document.createElement('a');
      frontLink.download = `cartao_${membro.numero_membro}_frente.png`;
      frontLink.href = frontCanvas.toDataURL('image/png');
      frontLink.click();

      const backLink = document.createElement('a');
      backLink.download = `cartao_${membro.numero_membro}_verso.png`;
      backLink.href = backCanvas.toDataURL('image/png');
      backLink.click();

      toast.dismiss(t);
      toast.success('Imagens PNG HD descarregadas!');
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error('Erro ao exportar imagens.');
    }
  };

  const exportPDF = async () => {
    const t = toast.loading('A gerar PDF de impressão PVC (CR80)...');
    try {
      const originalFlip = isFlipped;

      setIsFlipped(false);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const frontCanvas = await html2canvas(cardFrontRef.current, {
        scale: 3,
        useCORS: true,
      });

      setIsFlipped(true);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const backCanvas = await html2canvas(cardBackRef.current, {
        scale: 3,
        useCORS: true,
      });

      setIsFlipped(originalFlip);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98],
      });

      const frontImgData = frontCanvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(frontImgData, 'JPEG', 0, 0, 85.6, 53.98);

      pdf.addPage([85.6, 53.98], 'landscape');
      const backImgData = backCanvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(backImgData, 'JPEG', 0, 0, 85.6, 53.98);

      pdf.save(`cartao_${membro.numero_membro}_impressao.pdf`);

      toast.dismiss(t);
      toast.success('PDF para impressão PVC descarregado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error('Erro ao gerar o PDF.');
    }
  };

  return (
    <div className="fade-in space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/membros/${membro.id}`}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans' }}>
              <CreditCard size={20} style={{ color: 'var(--primary)' }} />
              Cartão de Membro
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Visualização de alta-fidelidade e exportação para impressão
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="btn btn-outline btn-sm gap-1.5"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            <RefreshCw size={14} className={isFlipped ? 'rotate-180 transition-transform' : 'transition-transform'} />
            Rodar Cartão
          </button>
          <button onClick={exportPNG} className="btn btn-outline btn-sm gap-1.5">
            <Download size={14} /> PNG HD
          </button>
          <button onClick={exportPDF} className="btn btn-primary btn-sm gap-1.5">
            <Printer size={14} /> PDF Impressão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left column: Theme Selector and Card info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
              Opções do Cartão
            </h3>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                Tema do Design
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setCardTheme('executive-blue')}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    cardTheme === 'executive-blue' ? 'border-[#0f2043] bg-blue-50 dark:bg-[#0f2043]/20' : 'border-transparent'
                  }`}
                  style={{ background: cardTheme === 'executive-blue' ? '' : 'var(--surface-2)', color: 'var(--text-1)' }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#0b1a30]" /> Executive Blue
                  </span>
                  {cardTheme === 'executive-blue' && <CheckCircle size={14} className="text-blue-600" />}
                </button>

                <button
                  onClick={() => setCardTheme('premium-gold')}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    cardTheme === 'premium-gold' ? 'border-[#d4af37] bg-amber-50 dark:bg-[#d4af37]/10' : 'border-transparent'
                  }`}
                  style={{ background: cardTheme === 'premium-gold' ? '' : 'var(--surface-2)', color: 'var(--text-1)' }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#2c2518]" /> Premium Gold
                  </span>
                  {cardTheme === 'premium-gold' && <CheckCircle size={14} className="text-amber-500" />}
                </button>

                <button
                  onClick={() => setCardTheme('charcoal-dark')}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    cardTheme === 'charcoal-dark' ? 'border-[#10b981] bg-emerald-50 dark:bg-emerald-500/10' : 'border-transparent'
                  }`}
                  style={{ background: cardTheme === 'charcoal-dark' ? '' : 'var(--surface-2)', color: 'var(--text-1)' }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#18191b]" /> Charcoal Emerald
                  </span>
                  {cardTheme === 'charcoal-dark' && <CheckCircle size={14} className="text-emerald-500" />}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2 items-center text-xs" style={{ color: 'var(--text-3)' }}>
                <Shield size={14} className="text-emerald-500" />
                <span>Pronto para impressão em PVC CR80 (85.6 x 53.9 mm)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: 3D Flip Card Workspace */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          
          <div className="w-[1011px] h-[638px] scale-[0.38] md:scale-[0.55] lg:scale-[0.72] origin-center my-[-150px] md:my-[-100px] lg:my-[-60px] cursor-pointer preserve-3d" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full duration-500 transform-style preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* CARD FRONT */}
              <div
                ref={cardFrontRef}
                className="absolute inset-0 rounded-[36px] overflow-hidden select-none backface-hidden shadow-2xl"
                style={{
                  background: activeTheme.bg,
                  width: '1011px',
                  height: '638px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: `3px solid ${activeTheme.accentColor}33`,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {/* Visual Watermarks */}
                <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div className="absolute top-[-50px] right-[-100px] w-[500px] h-[500px] rounded-full border-[10px] border-white" />
                  <div className="absolute bottom-[-100px] left-[-150px] w-[450px] h-[450px] rounded-full border-[6px] border-white" />
                </div>

                {/* Card Top Branding Header */}
                <div className="flex items-center justify-between px-10 pt-8 pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={logoImg}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-contain bg-white p-1 border-2"
                      style={{ borderColor: activeTheme.accentColor }}
                    />
                    <div>
                      <h2
                        className="text-[20px] font-extrabold tracking-wider leading-tight"
                        style={{ color: activeTheme.textColor }}
                      >
                        SF-DGCI
                      </h2>
                      <p
                        className="text-[10px] uppercase font-bold tracking-[0.2em] mt-0.5"
                        style={{ color: activeTheme.accentColor }}
                      >
                        Sindicato dos Funcionários da DGCI
                      </p>
                      <p className="text-[8px] font-medium tracking-[0.05em] text-slate-400">
                        República da Guiné-Bissau
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="text-[10px] uppercase font-extrabold px-3 py-1 rounded-full tracking-wider"
                      style={{
                        background: activeTheme.badgeBg,
                        color: activeTheme.badgeText,
                      }}
                    >
                      Membro Oficial
                    </span>
                  </div>
                </div>

                {/* Card Main Body Grid */}
                <div className="grid grid-cols-12 gap-8 px-10 pt-4 h-[380px] items-start">
                  
                  {/* Photo Container */}
                  <div className="col-span-3 flex flex-col items-center">
                    <div
                      className="w-44 h-48 rounded-[24px] overflow-hidden border-[4px] bg-slate-800 relative shadow-lg"
                      style={{ borderColor: activeTheme.accentColor }}
                    >
                      {membro.foto_url ? (
                        <img src={membro.foto_url} alt="Membro" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-extrabold text-4xl"
                          style={{ background: 'rgba(255,255,255,0.05)', color: activeTheme.accentColor }}
                        >
                          {membro.nome_completo.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {membro.fundo_social && (
                      <span className="mt-4 px-3 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase bg-purple-600 text-white flex items-center gap-1 shadow-md">
                        ★ Fundo Social
                      </span>
                    )}
                  </div>

                  {/* Information Details */}
                  <div className="col-span-6 flex flex-col justify-between h-[280px]">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: activeTheme.accentColor }}>
                        Nome do Titular
                      </p>
                      <h3
                        className="text-[26px] font-extrabold tracking-wide mt-1 leading-tight capitalize truncate"
                        style={{ color: activeTheme.textColor }}
                      >
                        {membro.nome_completo.toLowerCase()}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeTheme.labelColor }}>
                          Cargo / Função
                        </p>
                        <p className="text-[14px] font-bold truncate mt-0.5" style={{ color: activeTheme.textColor }}>
                          {membro.cargo_nome || membro.funcao_cargo || 'Membro do Quadro'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeTheme.labelColor }}>
                          Direção / Serviço
                        </p>
                        <p className="text-[14px] font-bold truncate mt-0.5" style={{ color: activeTheme.textColor }}>
                          {membro.departamento_nome || 'Sem Serviço'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeTheme.labelColor }}>
                          Admissão
                        </p>
                        <p className="text-[14px] font-bold mt-0.5" style={{ color: activeTheme.textColor }}>
                          {formattedAdmissao}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeTheme.labelColor }}>
                          Validade
                        </p>
                        <p className="text-[14px] font-bold mt-0.5" style={{ color: activeTheme.textColor }}>
                          {formattedValidade}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activeTheme.labelColor }}>
                        Nº Cartão
                      </p>
                      <p className="text-[20px] font-mono font-bold tracking-widest text-white mt-0.5">
                        {membro.numero_membro}
                      </p>
                    </div>
                  </div>

                  {/* QR Code Validation */}
                  <div className="col-span-3 flex flex-col items-center justify-end h-[280px]">
                    {qrCodeUrl && (
                      <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200">
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                      </div>
                    )}
                    <span className="text-[8px] uppercase tracking-widest mt-2" style={{ color: activeTheme.subTextColor }}>
                      Validar Online
                    </span>
                  </div>

                </div>

                <div
                  className="absolute bottom-0 left-0 right-0 h-2"
                  style={{ background: `linear-gradient(90deg, ${activeTheme.accentColor} 0%, #ffffff 50%, ${activeTheme.accentColor} 100%)` }}
                />
              </div>

              {/* CARD BACK */}
              <div
                ref={cardBackRef}
                className="absolute inset-0 rounded-[36px] overflow-hidden select-none backface-hidden rotate-y-180 shadow-2xl"
                style={{
                  background: activeTheme.bg,
                  width: '1011px',
                  height: '638px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: `3px solid ${activeTheme.accentColor}33`,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border-[12px] border-white" />
                </div>

                <div className="px-10 pt-8 text-center border-b pb-4 border-slate-700/50">
                  <h3 className="text-[15px] font-extrabold tracking-[0.25em]" style={{ color: activeTheme.accentColor }}>
                    CONDIÇÕES DE UTILIZAÇÃO
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-2 max-w-2xl mx-auto leading-relaxed">
                    Este cartão é pessoal e intransmissível, constituindo propriedade exclusiva do Sindicato SF-DGCI.
                    Deve ser apresentado sempre que solicitado pelas autoridades ou representantes oficiais do sindicato.
                    Em caso de perda ou extravio, por favor contactar a secretaria nacional.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-10 px-10 pt-8 items-center h-[280px]">
                  
                  {/* Union Mission */}
                  <div className="space-y-4 pr-6 border-r border-slate-700/50">
                    <h4 className="text-[12px] font-extrabold tracking-wider" style={{ color: activeTheme.accentColor }}>
                      A NOSSA MISSÃO
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      "Unidos para defender e promover os direitos fundamentais, sociais e profissionais de todos os
                      funcionários da Direção-Geral de Contribuições e Impostos da Guiné-Bissau."
                    </p>
                    <div className="flex gap-4 text-[9px] text-slate-400">
                      <span>• Transparência</span>
                      <span>• Solidariedade</span>
                      <span>• Justiça</span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    
                    <div className="flex flex-col items-center">
                      <div className="w-full h-24 border border-dashed border-slate-600 rounded-lg bg-slate-900/40 flex items-center justify-center relative">
                        <span className="text-[9px] text-slate-600 italic">Espaço para assinatura</span>
                      </div>
                      <span className="text-[9px] font-extrabold tracking-widest uppercase mt-2" style={{ color: activeTheme.labelColor }}>
                        Assinatura Titular
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-full h-24 border border-slate-700 rounded-lg bg-slate-900/60 flex flex-col items-center justify-center relative overflow-hidden">
                        <svg className="w-20 h-12 text-slate-400 opacity-60 absolute" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10 25 C 20 5, 30 45, 45 25 C 55 10, 60 40, 75 25 C 85 15, 90 35, 95 25" />
                        </svg>
                        <span className="text-[8px] font-bold text-slate-500 absolute bottom-1">Selo Digital</span>
                      </div>
                      <span className="text-[9px] font-extrabold tracking-widest uppercase mt-2" style={{ color: activeTheme.labelColor }}>
                        Assinatura Direção
                      </span>
                    </div>

                  </div>

                </div>

                {/* Footer Section */}
                <div className="absolute bottom-0 left-0 right-0 px-10 py-5 bg-black/40 flex items-center justify-between border-t border-slate-800">
                  <div className="flex items-center gap-6 text-[10px] text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Phone size={11} className="text-emerald-500" /> +245 955 117 776
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} className="text-emerald-500" /> contacto@sf-dgci.gw
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-emerald-500" /> Bissau, Guiné-Bissau
                    </span>
                  </div>

                  <span className="text-[9px] font-bold tracking-widest" style={{ color: activeTheme.accentColor }}>
                    WWW.SF-DGCI.GW
                  </span>
                </div>

              </div>

            </div>
          </div>

          <span className="mt-4 text-xs text-slate-400 flex items-center gap-2 select-none">
            <RefreshCw size={12} className="animate-spin-slow" />
            Clique no cartão para o rodar e ver o verso
          </span>
        </div>
      </div>
    </div>
  );
};

export default MembroCartao;
