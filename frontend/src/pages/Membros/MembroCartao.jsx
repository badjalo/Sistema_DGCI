import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import logoImg from '../../assets/logo.png';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, CreditCard, Download, Printer, RefreshCw, Shield, User, Briefcase, Building2, Calendar, Layers } from 'lucide-react';
import assinaturaPresidenteImg from '../../assets/assinatura_presidente.png';

const MembroCartao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

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
      const dataAdmissao = new Date(membro.data_admissao);
      const dataValidade = membro.data_validade
        ? new Date(membro.data_validade)
        : new Date(dataAdmissao.getFullYear() + 4, dataAdmissao.getMonth(), dataAdmissao.getDate());
      const formattedAdmissao = `${String(dataAdmissao.getDate()).padStart(2, '0')}/${String(dataAdmissao.getMonth() + 1).padStart(2, '0')}/${dataAdmissao.getFullYear()}`;
      const formattedValidade = `${String(dataValidade.getDate()).padStart(2, '0')}/${String(dataValidade.getMonth() + 1).padStart(2, '0')}/${dataValidade.getFullYear()}`;

      const qrData = `SINDICATO DOS FUNCIONÁRIOS DA DGCI
---------------------------
Nome: ${membro.nome_completo || 'N/D'}
Nº Membro: ${membro.numero_membro || 'N/D'}
Função: ${membro.funcao_cargo || membro.cargo_nome || 'N/D'}
Serviço: ${membro.departamento_nome || 'N/D'}
Admissão: ${membro.data_admissao ? formattedAdmissao : 'N/D'}
Validade: ${membro.data_admissao ? formattedValidade : 'N/D'}
Estado: ${membro.estado === 'ativo' ? 'Ativo' : 'Inativo'}`;

      QRCode.toDataURL(qrData, {
        margin: 1,
        width: 150,
        color: {
          dark: '#003B8E',
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
  const dataValidade = membro.data_validade
    ? new Date(membro.data_validade)
    : new Date(dataAdmissao.getFullYear() + 4, dataAdmissao.getMonth(), dataAdmissao.getDate());
  const formattedValidade = `${String(dataValidade.getDate()).padStart(2, '0')}/${String(dataValidade.getMonth() + 1).padStart(2, '0')}/${dataValidade.getFullYear()}`;
  const formattedAdmissao = `${String(dataAdmissao.getDate()).padStart(2, '0')}/${String(dataAdmissao.getMonth() + 1).padStart(2, '0')}/${dataAdmissao.getFullYear()}`;

  const profession = membro.profissao || membro.cargo_nome || membro.funcao_cargo || '—';
  const role = membro.funcao_cargo || membro.cargo_nome || '—';
  const service = membro.departamento_nome || '—';
  const fundoSocialLabel = membro.fundo_social ? 'Inscrito' : 'Não inscrito';
  const category = membro.categoria || 'EFETIVO';

  const activeTheme = {
    bg: 'linear-gradient(135deg, #f7faff 0%, #edf4ff 100%)',
    accentColor: '#ffffff',
    accentAlt: '#c7d9ff',
    textColor: '#04194E',
    textStrong: '#04194E',
    labelColor: '#1F3F8F',
    badgeBg: 'rgba(0, 59, 142, 0.1)',
    badgeText: '#ffffff',
    infoBg: '#ffffff',
    cardBg: '#f7faff',
    border: '#cfd9ee',
  };

  // Helper: pre-load all images inside an element with crossOrigin = 'anonymous'
  const preloadImages = (el) => {
    const imgs = Array.from(el.querySelectorAll('img'));
    return Promise.all(imgs.map(img =>
      new Promise(resolve => {
        const src = img.src;
        img.crossOrigin = 'anonymous';
        img.src = '';
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      })
    ));
  };

  // Helper: capture a card face element without being affected by 3D flip CSS
  const captureCard = async (ref) => {
    // Clone the element into a temporary off-screen container — no 3D transforms
    const original = ref.current;
    if (!original) throw new Error('Card ref not found');

    const clone = original.cloneNode(true);
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: `${original.offsetWidth}px`,
      height: `${original.offsetHeight}px`,
      overflow: 'hidden',
      zIndex: '-1',
    });
    // Reset any 3D transforms on the clone
    clone.style.transform = 'none';
    clone.style.position = 'relative';
    clone.style.backfaceVisibility = 'visible';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Pre-load images inside clone
    await preloadImages(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale: 4,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      width: original.offsetWidth,
      height: original.offsetHeight,
    });

    document.body.removeChild(wrapper);
    return canvas;
  };

  const exportPNG = async () => {
    const t = toast.loading('A preparar imagens HD...');
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        captureCard(cardFrontRef),
        captureCard(cardBackRef),
      ]);

      const frontLink = document.createElement('a');
      frontLink.download = `cartao_${membro.numero_membro}_frente.png`;
      frontLink.href = frontCanvas.toDataURL('image/png');
      frontLink.click();

      await new Promise(r => setTimeout(r, 300));

      const backLink = document.createElement('a');
      backLink.download = `cartao_${membro.numero_membro}_verso.png`;
      backLink.href = backCanvas.toDataURL('image/png');
      backLink.click();

      toast.dismiss(t);
      toast.success('Imagens PNG HD descarregadas!');
    } catch (err) {
      console.error('[exportPNG]', err);
      toast.dismiss(t);
      toast.error('Erro ao exportar imagens: ' + err.message);
    }
  };

  const exportPDF = async () => {
    const t = toast.loading('A gerar PDF de impressão PVC (CR80)...');
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        captureCard(cardFrontRef),
        captureCard(cardBackRef),
      ]);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98],
      });

      pdf.addImage(frontCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 85.6, 53.98);
      pdf.addPage([85.6, 53.98], 'landscape');
      pdf.addImage(backCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 85.6, 53.98);

      pdf.save(`cartao_${membro.numero_membro}_impressao.pdf`);

      toast.dismiss(t);
      toast.success('PDF para impressão PVC descarregado!');
    } catch (err) {
      console.error('[exportPDF]', err);
      toast.dismiss(t);
      toast.error('Erro ao gerar PDF: ' + err.message);
    }
  };

  const downloadPDFFromServer = async () => {
    const t = toast.loading('A descarregar cartão do servidor...');
    try {
      const response = await api.get(`/membros/${membro.id}/cartao`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cartao_${membro.numero_membro}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(t);
      toast.success('Cartão descarregado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error('Erro ao descarregar o cartão.');
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
          <button onClick={downloadPDFFromServer} className="btn btn-primary btn-sm gap-1.5">
            <Download size={14} /> PDF Servidor
          </button>
          <button onClick={exportPDF} className="btn btn-outline btn-sm gap-1.5">
            <Printer size={14} /> PDF Local
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        {/* Info strip */}
        <div className="flex items-center gap-2 px-1" style={{ color: 'var(--text-3)' }}>
          <Shield size={14} className="text-emerald-500 flex-shrink-0" />
          <span className="text-xs">Formato CR80 85.6 × 53.98 mm — impressão PVC. Clique no cartão para rodar.</span>
        </div>

        {/* Full-width Card Workspace */}
        <div className="w-full flex flex-col items-center justify-start overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">

          <div id="cartao-container" className={`cartao-preview ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
            <style>{`
              .cartao-preview * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: Inter, Arial, Helvetica, sans-serif;
              }
              .cartao-preview {
                position: relative;
                min-height: 718px;
                background: transparent;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
                width: 1091px;
                transform: scale(0.68);
                transform-origin: top center;
                margin-bottom: -230px;
              }
              .cartao-preview:hover {
                cursor: pointer;
              }
              .cartao-preview .card {
                width: 1011px;
                height: 638px;
                border-radius: 28px;
                overflow: hidden;
                position: absolute;
                top: 40px;
                left: 50%;
                transform: translateX(-50%);
                background: transparent;
                box-shadow: 0 25px 80px rgba(15, 23, 42, 0.16);
                border: 1px solid rgba(15, 23, 42, 0.08);
                transition: transform 0.9s ease, opacity 0.9s ease;
                backface-visibility: hidden;
                transform-style: preserve-3d;
              }
              .cartao-preview .front {
                transform: rotateY(0deg);
                background: linear-gradient(135deg, #f7faff 0%, #edf4ff 100%);
              }
              .cartao-preview .back {
                transform: rotateY(180deg);
              }
              .cartao-preview.flipped .front {
                transform: rotateY(-180deg);
              }
              .cartao-preview.flipped .back {
                transform: rotateY(0deg);
              }
              .cartao-preview .watermark,
              .cartao-preview .back-watermark {
                position: absolute;
                width: 700px;
                opacity: 0.06;
                right: 20px;
                top: 20px;
                filter: blur(0.6px);
              }
              .cartao-preview .front-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 160px;
                background: #0b1f4e;
                display: flex;
                align-items: center;
                gap: 24px;
                padding: 0 40px;
              }
              .cartao-preview .header-logo {
                width: 120px;
                height: 120px;
                border-radius: 16px;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px;
                box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
                flex-shrink: 0;
              }
              .cartao-preview .header-logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              .cartao-preview .header-text {
                color: white;
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                line-height: 1.4;
                flex: 1;
              }
              .cartao-preview .header-text .line {
                display: block;
              }
              .cartao-preview .title {
                position: absolute;
                top: 163px;
                left: 0;
                right: 0;
                width: 100%;
                text-align: center;
                color: #0b1f4e;
              }
              .cartao-preview .title .name {
                font-size: 14px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #1f3f7e;
                margin-bottom: 10px;
                font-weight: 700;
              }
              .cartao-preview .title h1 {
                font-size: 28px;
                line-height: 1.05;
                font-weight: 900;
                letter-spacing: 0.08em;
              }
              .cartao-preview .accent-wave {
                position: absolute;
                top: 132px;
                left: 0;
                width: 100%;
                height: 200px;
                background: radial-gradient(circle at 20% 20%, rgba(0,59,142,0.18), transparent 34%), radial-gradient(circle at 75% 80%, rgba(0,59,142,0.12), transparent 28%);
                pointer-events: none;
              }
              .cartao-preview .photo {
                position: absolute;
                left: 45px;
                top: 180px;
                width: 250px;
                height: 320px;
                border-radius: 28px;
                overflow: hidden;
                border: 5px solid #ffffff;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
                background: #f3f6ff;
              }
              .cartao-preview .photo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              .cartao-preview .member-number-front {
                position: absolute;
                left: 40px;
                top: 553px;
                width: 280px;
                background: transparent;
                border-radius: 0;
                padding: 8px 16px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                border: none;
                box-shadow: none;
              }
              .cartao-preview .member-number-front .mn-label {
                color: #1f3f7e;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.16em;
                text-transform: uppercase;
              }
              .cartao-preview .member-number-front .mn-value {
                color: #0b1f4e;
                font-size: 16px;
                font-weight: 900;
                letter-spacing: 0.12em;
              }
              .cartao-preview .info {
                position: absolute;
                left: 344px;
                top: 192px;
                width: 610px;
                padding: 18px 20px 0;
                color: #111;
                line-height: 1.7;
                background: transparent;
                border-radius: 28px;
                border: none;
                box-shadow: none;
              }
              .cartao-preview .info-grid {
                display: grid;
                grid-template-columns: 160px 1fr;
                gap: 10px 16px;
                align-items: baseline;
              }
              .cartao-preview .info-row {
                display: contents;
              }
              .cartao-preview .label {
                color: #21447c;
                font-size: 16px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
              }
              .cartao-preview .value {
                color: #0f1f4e;
                font-size: 24px;
                font-weight: 400;
                line-height: 1.2;
              }
              .cartao-preview .signatures {
                position: absolute;
                left: 344px;
                bottom: 18px;
                width: 610px;
                padding: 24px 30px;
                border-radius: 24px;
                background: transparent;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .cartao-preview .signature {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
              }
              .cartao-preview .signature .line {
                width: 220px;
                height: 2px;
                background: rgba(15, 23, 42, 0.24);
              }
              .cartao-preview .signature .name {
                font-size: 14px;
                color: #0b1f4e;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                text-align: center;
              }
              .cartao-preview .back {
                background: linear-gradient(135deg, #f7faff 0%, #e7efff 100%);
              }
              .cartao-preview .back-header {
                background: #0b1f4e;
                height: 170px;
                display: flex;
                align-items: center;
                gap: 24px;
                padding: 0 40px;
              }
              .cartao-preview .back-header img {
                width: 120px;
                height: 120px;
                background: white;
                border-radius: 28px;
                padding: 12px;
                object-fit: contain;
              }
              .cartao-preview .header-text p {
                margin-bottom: 12px;
                font-size: 13px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.82);
              }
              .cartao-preview .header-text h2 {
                font-size: 32px;
                line-height: 1.05;
                font-weight: 900;
                color: #ffffff;
              }
              .cartao-preview .member-number {
                margin-left: auto;
                text-align: right;
                color: rgba(255,255,255,0.95);
                font-size: 14px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
              }
              .cartao-preview .member-number strong {
                display: block;
                margin-top: 8px;
                font-size: 28px;
                font-weight: 900;
              }
              .cartao-preview .back-content {
                position: absolute;
                left: 42px;
                right: 262px;
                top: 220px;
                bottom: 110px;
                padding: 42px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 24px;
              }
              .cartao-preview .back-content h3 {
                color: #0b1f4e;
                font-size: 30px;
                font-weight: 900;
                margin: 0;
              }
              .cartao-preview .back-content p {
                color: #1a2d5b;
                font-size: 20px;
                line-height: 1.85;
                max-width: 520px;
                margin: 0;
              }
              .cartao-preview .back-content .description {
                color: #334271;
                font-size: 16px;
                line-height: 1.75;
                margin-top: 8px;
              }
              .cartao-preview .back-content .signature {
                margin-top: 24px;
                align-items: flex-start;
                text-align: left;
                margin-left: auto;
                width: auto;
              }
              .cartao-preview .qr {
                position: absolute;
                right: 42px;
                top: 240px;
                width: 200px;
                height: 200px;
                border-radius: 26px;
                background: white;
                padding: 18px;
                border: 1px solid rgba(15, 23, 42, 0.12);
                box-shadow: 0 22px 46px rgba(15, 23, 42, 0.08);
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .cartao-preview .qr img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              .cartao-preview .footer {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 110px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 48px;
                background: #0b1f4e;
                color: rgba(255,255,255,0.95);
                font-size: 18px;
                font-weight: 500;
                letter-spacing: 0.03em;
                line-height: 1.4;
              }
              .cartao-preview .footer div {
                max-width: 280px;
              }
              .cartao-preview .footer .separator {
                width: 1px;
                height: 48px;
                background: rgba(255,255,255,0.18);
                margin: 0 18px;
                flex-shrink: 0;
              }
            `}</style>

            <div className="card front" ref={cardFrontRef}>
              <img className="watermark" src={logoImg} alt="Watermark" />
              <div className="front-header">
                <div className="header-logo">
                  <img src={logoImg} alt="Logo" />
                </div>
                <div className="header-text">
                  <span className="line">SINDICATO DOS FUNCIONÁRIOS DA</span>
                  <span className="line">DIREÇÃO-GERAL DAS CONTRIBUIÇÕES E IMPOSTOS</span>
                </div>
              </div>
              <div className="title">
                <h1>CARTÃO DE MEMBRO</h1>
              </div>
              <div className="accent-wave" />
              <div className="photo">
                <img src={membro.foto_url || logoImg} alt="Membro" />
              </div>

              <div className="info">
                <div className="info-grid">
                  <div className="label">Nome</div>
                  <div className="value">{membro.nome_completo}</div>
                  <div className="label">Função</div>
                  <div className="value">{role}</div>
                  <div className="label">Serviço</div>
                  <div className="value">{service}</div>
                  <div className="label">Fundo Social</div>
                  <div className="value">{fundoSocialLabel}</div>
                  <div className="label">Data de Admissão</div>
                  <div className="value">{formattedAdmissao}</div>
                  <div className="label">Validade</div>
                  <div className="value">{formattedValidade}</div>
                </div>
              </div>

              <div className="footer" style={{ justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '100%', whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 600, marginRight: 12 }}>Nº de Membro:</span>
                  <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.1em', color: '#ffffff' }}>{membro.numero_membro}</span>
                </div>
              </div>

            </div>

            <div className="card back" ref={cardBackRef}>
              <div className="back-header">
                <img src={logoImg} alt="Logo" />
                <div className="header-text">
                  <p>SF-DGCI</p>
                  <h2>SINDICATO DOS FUNCIONÁRIOS - DGCI</h2>
                </div>
              </div>
              <img className="back-watermark" src={logoImg} alt="Watermark" />
              <div className="back-content" style={{ paddingTop: 10, top: 130 }}>
                <h3>ESTE CARTÃO É PESSOAL E INTRANSMISSÍVEL</h3>
                <p>
                  Confere ao titular o direito de usufruir de todos os benefícios e serviços disponibilizados pelo Sindicato dos Funcionários da DGCI, nos termos dos Estatutos e Regulamentos em vigor.
                </p>
              </div>
              {/* Assinatura do Presidente — posicionada acima do rodapé */}
              <div style={{
                position: 'absolute',
                bottom: 115,
                left: 'auto',
                right: 350,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}>
                <div style={{ height: 85, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <img
                    src={assinaturaPresidenteImg}
                    alt="Assinatura do Presidente"
                    style={{
                      maxHeight: 110,
                      maxWidth: 360,
                      objectFit: 'contain',
                      display: 'block',
                      background: 'transparent',
                      marginBottom: -20
                    }}
                  />
                </div>
                <div style={{ width: 220, height: 2, background: 'rgba(15,23,42,0.24)' }} />
                <span style={{
                  fontSize: 13,
                  color: '#0b1f4e',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textAlign: 'center'
                }}>Assinatura do Presidente</span>
              </div>
              <div className="qr">
                {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" /> : <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />}
              </div>
              <div className="footer">
                <div>Av. João Bernardo Vieira, Edifício da DGCI, Bissau - Guiné-Bissau</div>
                <div className="separator" />
                <div>955 371 498</div>
                <div className="separator" />
                <div>sf-dgci@dgci.mef.gw</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembroCartao;
