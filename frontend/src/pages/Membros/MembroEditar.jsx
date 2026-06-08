import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, X, User, Camera, RefreshCw, Check } from 'lucide-react';

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
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setReady(true);
                }
            })
            .catch(() => toast.error('Sem acesso à câmara'));

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const shoot = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        setCaptured(canvas.toDataURL('image/jpeg', 0.92));
    };

    const retake = () => setCaptured(null);

    const confirm = () => {
        canvasRef.current.toBlob(blob => {
            if (blob) onCapture(blob, captured);
            onClose();
        }, 'image/jpeg', 0.92);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-6 text-white shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Tirar Foto</h2>
                    <button type="button" onClick={onClose} className="text-slate-300 hover:text-white"><X size={18} /></button>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full ${captured ? 'hidden' : 'block'}`} />
                    {captured && <img src={captured} alt="Captura" className="w-full object-cover" />}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    {!captured ? (
                        <button type="button" onClick={shoot} disabled={!ready} className="btn btn-primary flex items-center gap-2">
                            <Camera size={16} /> Capturar
                        </button>
                    ) : (
                        <>
                            <button type="button" onClick={retake} className="btn btn-outline flex items-center gap-2">
                                <RefreshCw size={16} /> Repetir
                            </button>
                            <button type="button" onClick={confirm} className="btn btn-primary flex items-center gap-2">
                                <Check size={16} /> Usar Foto
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const MembroEditar = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [departamentos, setDepartamentos] = useState([]);
    const [showCamera, setShowCamera] = useState(false);
    const [fotoFile, setFotoFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [activeCard, setActiveCard] = useState(null);
    const [cartaoDataValidade, setCartaoDataValidade] = useState('');
    const [renewing, setRenewing] = useState(false);

    const [formData, setFormData] = useState({
        nome_completo: '',
        email: '',
        telefone: '',
        sexo: 'masculino',
        data_nascimento: '',
        estado_civil: 'solteiro',
        morada: '',
        nif: '',
        bi_passaporte: '',
        funcao_cargo: '',
        departamento_id: '',
        data_admissao: new Date().toISOString().split('T')[0],
        estado: 'ativo',
        fundo_social: false,
        observacoes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membroRes, depRes, cardRes] = await Promise.all([
                    api.get(`/membros/${id}`),
                    api.get('/departamentos'),
                    api.get(`/cartoes/ativo/${id}`)
                ]);

                const membro = membroRes.data.data;
                setFormData({
                    nome_completo: membro.nome_completo || '',
                    email: membro.email || '',
                    telefone: membro.telefone || '',
                    sexo: membro.sexo || 'masculino',
                    data_nascimento: membro.data_nascimento?.split('T')[0] || '',
                    estado_civil: membro.estado_civil || 'solteiro',
                    morada: membro.morada || '',
                    nif: membro.nif || '',
                    bi_passaporte: membro.bi_passaporte || '',
                    funcao_cargo: membro.funcao_cargo || '',
                    departamento_id: membro.departamento_id || '',
                    data_admissao: membro.data_admissao?.split('T')[0] || '',
                    estado: membro.estado || 'ativo',
                    fundo_social: membro.fundo_social || false,
                    observacoes: membro.observacoes || ''
                });

                if (membro.foto_url) {
                    setPreview(membro.foto_url);
                }
                setActiveCard(cardRes.data.data || null);
                setCartaoDataValidade(cardRes.data.data?.data_validade?.split('T')[0] || '');
                setDepartamentos(depRes.data.data);
                setLoadingData(false);
            } catch (error) {
                toast.error('Erro ao carregar dados do membro');
                navigate('/membros');
            }
        };

        fetchData();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value, files, type } = e.target;
        if (type === 'file') {
            const file = files[0];
            setFotoFile(file || null);
            setPreview(file ? URL.createObjectURL(file) : '');
            return;
        }

        if (name === 'telefone') {
            setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
        } else if (name === 'fundo_social') {
            setFormData(prev => ({ ...prev, [name]: value === 'true' }));
        } else if (name === 'cartao_data_validade') {
            setCartaoDataValidade(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCameraCapture = (blob, dataUrl) => {
        // Converter blob em File com nome apropriado
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFotoFile(file);
        setPreview(dataUrl);
    };

    const formatPhone = (input) => {
        const digits = (input || '').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('245') && digits.length >= 12) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
        }
        return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    };

    const handleRenewCard = async () => {
        setRenewing(true);
        try {
            const payload = {};
            if (cartaoDataValidade) payload.data_validade = cartaoDataValidade;
            const response = await api.post(`/cartoes/renovar/${id}`, payload);
            setActiveCard(response.data.data);
            setCartaoDataValidade(response.data.data?.data_validade?.split('T')[0] || '');
            toast.success(response.data.message || 'Validade do cartão atualizada com sucesso!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao renovar validade do cartão');
        } finally {
            setRenewing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // validações simples
            const nifDigits = (formData.nif || '').replace(/\D/g, '');
            if (nifDigits && nifDigits.length !== 9) {
                toast.error('NIF inválido. Deve conter 9 dígitos.');
                setLoading(false);
                return;
            }
            const telDigits = (formData.telefone || '').replace(/\D/g, '');
            if (telDigits && telDigits.length < 9) {
                toast.error('Telefone inválido. Insira pelo menos 9 dígitos.');
                setLoading(false);
                return;
            }

            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    data.append(key, value);
                }
            });
            if (fotoFile) {
                // Adicionar foto com nome apropriado
                const fileName = fotoFile.name || `camera_${Date.now()}.jpg`;
                data.append('foto', fotoFile, fileName);
            }

            await api.put(`/membros/${id}`, data);
            toast.success('Membro atualizado com sucesso!');
            // Limpar cache da foto para forçar recarga
            setFotoFile(null);
            setPreview('');
            navigate(`/membros/${id}`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar membro');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return <div className="flex justify-center p-12"><div className="spinner"></div></div>;
    }

    return (
        <>
            {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
            <div className="fade-in space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                            <User size={28} className="text-blue-600" />
                            Editar Perfil do Membro
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Atualize os dados pessoais e profissionais do funcionário</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => navigate(`/membros/${id}`)} className="btn btn-outline">
                            <X size={18} /> Cancelar
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                            {loading ? <div className="spinner w-5 h-5 border-2"></div> : <><Save size={18} /> Guardar Alterações</>}
                        </button>
                    </div>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Dados Pessoais */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Dados Pessoais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="form-group">
                                    <label className="form-label">Nome Completo *</label>
                                    <input type="text" name="nome_completo" required value={formData.nome_completo} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data de Nascimento *</label>
                                    <input type="date" name="data_nascimento" required value={formData.data_nascimento} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Género</label>
                                    <div className="form-control-select-wrapper">
                                        <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-control">
                                            <option value="masculino">Masculino</option>
                                            <option value="feminino">Feminino</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
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
                                <div className="form-group lg:col-span-2">
                                    <label className="form-label">Morada Completa</label>
                                    <input type="text" name="morada" value={formData.morada} onChange={handleChange} className="form-control" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Foto do Membro</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-slate-50">
                                    <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                        {preview ? (
                                            <img src={preview} alt="Foto do membro" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-400 text-5xl font-semibold">{formData.nome_completo ? formData.nome_completo.charAt(0).toUpperCase() : 'M'}</span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setShowCamera(true)} className="btn btn-secondary w-full justify-center flex items-center gap-2">
                                        <Camera size={16} /> Tirar foto diretamente
                                    </button>
                                    <label className="btn btn-outline w-full justify-center cursor-pointer">
                                        Alterar fotografia
                                        <input type="file" name="foto" accept="image/*" onChange={handleChange} className="hidden" />
                                    </label>
                                    {fotoFile && (
                                        <button type="button" onClick={() => { setFotoFile(null); setPreview(''); }} className="btn btn-link text-red-600">
                                            Remover foto selecionada
                                        </button>
                                    )}
                                    <p className="text-xs text-slate-500 text-center">Não selecionar ficheiro mantém a foto atual.</p>
                                </div>
                                <div className="p-4 border rounded-xl bg-slate-50">
                                    <p className="text-sm text-slate-700">Se pretende alterar a foto do membro, selecione um novo ficheiro acima. Caso contrário, a fotografia atual continuará a ser usada.</p>
                                </div>
                            </div>
                        </div>

                        {/* Contactos e Documentos */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Contactos e Identificação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="form-group">
                                    <label className="form-label">Email Institucional</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Telefone</label>
                                    <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">NIF (Opcional)</label>
                                    <input type="text" name="nif" value={formData.nif} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bilhete Identidade / CNI *</label>
                                    <input type="text" name="bi_passaporte" required value={formData.bi_passaporte} onChange={handleChange} className="form-control" />
                                </div>
                            </div>
                        </div>

                        {/* Dados Profissionais e Sindicais */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Vínculo Sindical e Profissional</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <div className="form-group">
                                    <label className="form-label">Cargo / Função</label>
                                    <input type="text" name="funcao_cargo" value={formData.funcao_cargo} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Departamento</label>
                                    <div className="form-control-select-wrapper">
                                        <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} className="form-control">
                                            <option value="">-- Selecione o Departamento --</option>
                                            {departamentos.map(dep => {
                                                const ativos = dep.membros_ativos || 0;
                                                const limite = dep.limite_quadros || 0;
                                                const isCurrentDept = dep.id === formData.departamento_id;
                                                const isFull = limite > 0 && ativos >= limite && !isCurrentDept;

                                                let label = `${dep.nome} (${dep.sigla})`;
                                                if (limite > 0) {
                                                    label += ` — ${ativos}/${limite} vagas`;
                                                    if (ativos >= limite) {
                                                        label += isCurrentDept ? ' (Atual)' : ' (Esgotado ❌)';
                                                    }
                                                } else {
                                                    label += ' — Ilimitado';
                                                }

                                                return (
                                                    <option key={dep.id} value={dep.id} disabled={isFull}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data de Admissão</label>
                                    <input type="date" name="data_admissao" required value={formData.data_admissao} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado</label>
                                    <div className="form-control-select-wrapper">
                                        <select name="estado" value={formData.estado} onChange={handleChange} className="form-control">
                                            <option value="ativo">Ativo</option>
                                            <option value="suspenso">Suspenso</option>
                                            <option value="reformado">Reformado</option>
                                            <option value="inativo">Inativo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="form-group">
                                    <label className="form-label">Inscrito no Fundo Social?</label>
                                    <div className="form-control-select-wrapper">
                                        <select name="fundo_social" value={formData.fundo_social ? 'true' : 'false'} onChange={handleChange} className="form-control">
                                            <option value="false">Não</option>
                                            <option value="true">Sim</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Validade do Cartão</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                <div className="form-group">
                                    <label className="form-label">Validade Atual</label>
                                    <input type="text" readOnly value={activeCard?.data_validade ? new Date(activeCard.data_validade).toLocaleDateString('pt-PT') : 'Sem cartão ativo'} className="form-control bg-slate-100" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nova validade</label>
                                    <input type="date" name="cartao_data_validade" value={cartaoDataValidade} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="lg:col-span-2">
                                    <button type="button" onClick={handleRenewCard} disabled={renewing} className="btn btn-secondary w-full">
                                        {renewing ? 'A atualizar validade...' : 'Prolongar validade do cartão'}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Pode escolher uma nova data de validade ou deixar em branco para renovar automaticamente por 2 anos.</p>
                        </div>

                        {/* Observações */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Observações</h3>
                            <div className="form-group">
                                <label className="form-label">Notas Adicionais</label>
                                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows="4" className="form-control" placeholder="Adicione observações sobre este membro..."></textarea>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
};

export default MembroEditar;
