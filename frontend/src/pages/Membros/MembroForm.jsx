import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, X, User } from 'lucide-react';

const MembroForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [numeroMembro, setNumeroMembro] = useState('');

  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    sexo: 'masculino',
    data_nascimento: '',
    estado_civil: 'solteiro',
    morada: '',
    nif: '',
    numero_identificacao: '',
    bi_passaporte: '',
    nib: '',
    departamento_id: '',
    data_admissao: new Date().toISOString().split('T')[0],
    estado: 'ativo',
    fundo_social: false
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const { data } = await api.get('/departamentos');
        setDepartamentos(data.data);
      } catch (error) {
        toast.error('Erro ao carregar departamentos');
      }
    };
    fetchDepartamentos();
    // buscar próximo número de membro
    const fetchNumero = async () => {
      try {
        const res = await api.get('/membros/next-numero');
        if (res.data && res.data.numero) setNumeroMembro(res.data.numero);
      } catch (err) {
        // não bloquear formulário por falha aqui
      }
    };
    fetchNumero();
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, foto: file }));
      if (file) setPreview(URL.createObjectURL(file));
      else setPreview(null);
    } else {
      // format telefone on the fly
      if (name === 'telefone') {
        const formatted = formatPhone(value);
        setFormData(prev => ({ ...prev, [name]: formatted }));
      } else if (name === 'fundo_social') {
        setFormData(prev => ({ ...prev, [name]: value === 'true' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const formatPhone = (input) => {
    const digits = (input || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('245') && digits.length >= 12) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
    }
    // fallback grouping by 3
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // NIF validation: if provided, must be 9 digits
      const nifDigits = (formData.nif || '').replace(/\D/g, '');
      if (nifDigits && nifDigits.length !== 9) {
        toast.error('NIF inválido. Deve conter 9 dígitos.');
        setLoading(false);
        return;
      }
      // telefone validation: if provided, at least 9 digits
      const telDigits = (formData.telefone || '').replace(/\D/g, '');
      if (telDigits && telDigits.length < 9) {
        toast.error('Telefone inválido. Insira pelo menos 9 dígitos.');
        setLoading(false);
        return;
      }
      const data = new FormData();
      // incluir numero_membro gerado automaticamente
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
      if (formData.foto) data.append('foto', formData.foto);

      await api.post('/membros', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Membro registado com sucesso!');
      navigate('/membros');
    } catch (error) {
      console.error('Erro ao registar membro:', error);
      toast.error(error.response?.data?.error || 'Erro ao registar membro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in space-y-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            <User size={32} className="text-blue-600" />
            Registar Novo Membro
          </h1>
          <p className="text-slate-600 text-sm mt-2">Preencha os dados pessoais e profissionais do funcionário</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">Informações Pessoais</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Photo Section */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-slate-400 text-3xl overflow-hidden border-4 border-slate-200">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold">{formData.nome_completo ? formData.nome_completo.charAt(0).toUpperCase() : 'M'}</span>
                  )}
                </div>
                <label className="btn-outline w-full text-center text-sm justify-center cursor-pointer">
                  Carregar Foto
                  <input type="file" name="foto" accept="image/*" onChange={handleChange} className="hidden" />
                </label>
                <div className="w-full text-center">
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
                    if (limite > 0) {
                      label += ` — ${ativos}/${limite} vagas`;
                      if (isFull) label += ' (Esgotado ❌)';
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
          <button type="button" onClick={() => navigate('/membros')} className="btn-outline">
            <X size={18} /> Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <div className="spinner w-5 h-5 border-2"></div> : <><Save size={18} /> Registar Membro</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MembroForm;
