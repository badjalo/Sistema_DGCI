import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, X, User, Camera, RefreshCw, Check, PenTool, Trash2, Upload } from 'lucide-react';

/* ─── Camera Modal ──────────────────────────────────────────── */
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setReady(true); }
      })
      .catch(() => toast.error('Sem acesso à câmara'));
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const shoot = () => {
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setCaptured(c.toDataURL('image/jpeg', 0.92));
  };

  const retake = () => setCaptured(null);

  const confirm = () => {
    const c = canvasRef.current;
    c.toBlob(blob => { onCapture(blob, captured); onClose(); }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e293b', borderRadius:16, padding:24, width:520, maxWidth:'95vw' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:700 }}>📷 Tirar Foto</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }}><X size={22}/></button>
        </div>

        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#000', aspectRatio:'4/3' }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width:'100%', height:'100%', objectFit:'cover', display: captured ? 'none' : 'block' }} />
          {captured && <img src={captured} alt="captura" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
          <canvas ref={canvasRef} style={{ display:'none' }} />
        </div>

        <div style={{ display:'flex', gap:12, marginTop:16, justifyContent:'center' }}>
          {!captured ? (
            <button onClick={shoot} disabled={!ready}
              style={{ background:'#3b82f6', color:'#fff', border:'none', borderRadius:10, padding:'10px 28px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
              <Camera size={18}/> Capturar
            </button>
          ) : (
            <>
              <button onClick={retake}
                style={{ background:'#475569', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                <RefreshCw size={16}/> Repetir
              </button>
              <button onClick={confirm}
                style={{ background:'#22c55e', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                <Check size={16}/> Usar esta foto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


/* ─── Main Form ─────────────────────────────────────────────── */
const MembroForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [numeroMembro, setNumeroMembro] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [preview, setPreview] = useState(null);


  const [formData, setFormData] = useState({
    nome_completo: '', email: '', telefone: '', sexo: 'masculino',
    data_nascimento: '', estado_civil: 'solteiro', morada: '', nif: '',
    numero_identificacao: '', bi_passaporte: '', nib: '', departamento_id: '',
    data_admissao: new Date().toISOString().split('T')[0], estado: 'ativo', fundo_social: false
  });

  useEffect(() => {
    api.get('/departamentos').then(({ data }) => setDepartamentos(data.data)).catch(() => toast.error('Erro ao carregar departamentos'));
    api.get('/membros/next-numero').then(res => { if (res.data?.numero) setNumeroMembro(res.data.numero); }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) { setFotoBlob(file); setPreview(URL.createObjectURL(file)); }
      else { setFotoBlob(null); setPreview(null); }
    } else if (name === 'telefone') {
      setFormData(p => ({ ...p, [name]: formatPhone(value) }));
    } else if (name === 'fundo_social') {
      setFormData(p => ({ ...p, [name]: value === 'true' }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const formatPhone = (input) => {
    const d = (input || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('245') && d.length >= 12) return `+${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,9)} ${d.slice(9,12)}`;
    return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handleCameraCapture = (blob, dataUrl) => { setFotoBlob(blob); setPreview(dataUrl); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nifD = (formData.nif || '').replace(/\D/g, '');
      if (nifD && nifD.length !== 9) { toast.error('NIF inválido. Deve conter 9 dígitos.'); return; }
      const telD = (formData.telefone || '').replace(/\D/g, '');
      if (telD && telD.length < 9) { toast.error('Telefone inválido. Insira pelo menos 9 dígitos.'); return; }

      const data = new FormData();
      data.append('nome_completo', formData.nome_completo);
      data.append('sexo', formData.sexo);
      data.append('data_nascimento', formData.data_nascimento || '');
      data.append('estado_civil', formData.estado_civil);
      data.append('nif', formData.nif || '');
      data.append('bi_passaporte', formData.numero_identificacao || formData.bi_passaporte || '');
      data.append('telefone', formData.telefone || '');
      data.append('email', formData.email || '');
      data.append('morada', formData.morada || '');
      data.append('funcao_cargo', formData.funcao_cargo || '');
      data.append('cargo_id', formData.cargo_id || '');
      data.append('departamento_id', formData.departamento_id || '');
      data.append('data_admissao', formData.data_admissao || '');
      data.append('estado', formData.estado || 'ativo');
      data.append('observacoes', formData.observacoes || '');
      data.append('fundo_social', formData.fundo_social);
      if (fotoBlob) data.append('foto', fotoBlob, 'foto.jpg');


      await api.post('/membros', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Membro registado com sucesso!');
      navigate('/membros');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registar membro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto px-4">
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            <User size={32} className="text-blue-600" /> Registar Novo Membro
          </h1>
          <p className="text-slate-600 text-sm mt-2">Preencha os dados e carregue a foto do membro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">Informações Pessoais</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Photo Section */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center gap-3">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-slate-400 text-4xl overflow-hidden border-4 border-slate-200 shadow-md">
                  {preview
                    ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    : <span className="font-bold text-blue-400">{formData.nome_completo ? formData.nome_completo.charAt(0).toUpperCase() : 'M'}</span>
                  }
                </div>

                {/* Câmara */}
                <button type="button" onClick={() => setShowCamera(true)}
                  className="btn btn-primary w-full text-sm justify-center"
                  style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Camera size={16}/> Tirar Foto
                </button>

                {/* Upload ficheiro */}
                <label className="btn btn-outline w-full text-center text-sm justify-center cursor-pointer" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Upload size={15}/> Carregar Ficheiro
                  <input type="file" name="foto" accept="image/*" onChange={handleChange} className="hidden" />
                </label>

                {preview && (
                  <button type="button" onClick={() => { setFotoBlob(null); setPreview(null); }}
                    style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <Trash2 size={13}/> Remover foto
                  </button>
                )}

                <div className="w-full text-center mt-1">
                  <p className="text-xs text-slate-500 font-semibold">Nº de Membro</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">{numeroMembro || 'Auto'}</p>
                </div>
              </div>
            </div>

            {/* Personal Data */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nome Completo *</label>
                  <input type="text" name="nome_completo" required value={formData.nome_completo} onChange={handleChange} className="form-control" />
                </div>
                <div>
                  <label className="form-label">Data de Nascimento *</label>
                  <input type="date" name="data_nascimento" required value={formData.data_nascimento} onChange={handleChange} className="form-control" />
                </div>
                <div>
                  <label className="form-label">Sexo</label>
                  <div className="form-control-select-wrapper">
                    <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-control">
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Estado Civil</label>
                  <div className="form-control-select-wrapper">
                    <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="form-control">
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_facto">União de Facto</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Morada Completa</label>
                  <input type="text" name="morada" value={formData.morada} onChange={handleChange} className="form-control" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contactos e Documentos */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">Contactos e Documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="form-label">NIF (Opcional)</label>
              <input type="text" name="nif" value={formData.nif} onChange={handleChange} className="form-control" placeholder="Apenas dígitos" />
            </div>
            <div>
              <label className="form-label">BI / Passaporte *</label>
              <input type="text" name="numero_identificacao" required value={formData.numero_identificacao} onChange={handleChange} className="form-control" />
            </div>
          </div>
        </div>

        {/* Dados Profissionais */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">Dados Profissionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="form-label">Cargo / Função</label>
              <input type="text" name="funcao_cargo" value={formData.funcao_cargo || ''} onChange={handleChange} className="form-control" />
            </div>
            <div>
              <label className="form-label">Serviço / Direcção</label>
              <div className="form-control-select-wrapper">
                <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} className="form-control">
                  <option value="">-- Selecione --</option>
                  {departamentos.map(dep => {
                    const ativos = dep.membros_ativos || 0;
                    const limite = dep.limite_quadros || 0;
                    const isFull = limite > 0 && ativos >= limite;
                    let label = `${dep.nome} (${dep.sigla})`;
                    if (limite > 0) { label += ` — ${ativos}/${limite} vagas`; if (isFull) label += ' (Esgotado ❌)'; }
                    else label += ' — Ilimitado';
                    return <option key={dep.id} value={dep.id} disabled={isFull}>{label}</option>;
                  })}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Estado do Membro</label>
              <div className="form-control-select-wrapper">
                <select name="estado" value={formData.estado} onChange={handleChange} className="form-control">
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="reformado">Reformado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Data de Admissão</label>
              <input type="date" name="data_admissao" required value={formData.data_admissao} onChange={handleChange} className="form-control" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Inscrito no Fundo Social?</label>
              <div className="form-control-select-wrapper">
                <select name="fundo_social" value={formData.fundo_social ? 'true' : 'false'} onChange={handleChange} className="form-control">
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="form-label">Observações</label>
            <textarea name="observacoes" value={formData.observacoes || ''} onChange={handleChange} className="form-control" rows="3"></textarea>
          </div>
        </div>



        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/membros')} className="btn btn-outline">
            <X size={18} /> Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <div className="spinner w-5 h-5 border-2"></div> : <><Save size={18} /> Registar Membro</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MembroForm;
