import React, { useState } from 'react';
import { Download, FileText, Users, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Relatorios = () => {
  const [loadingReport, setLoadingReport] = useState(null);

  const handleExport = async (tipo, titulo, format) => {
    setLoadingReport(`${tipo}-${format}`);
    try {
      const response = await api.get('/relatorios/export', {
        params: { tipo, format, ano: new Date().getFullYear() },
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.href = url;
      link.download = `${tipo}_${new Date().getFullYear()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Relatório de ${titulo} gerado com sucesso!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar o relatório');
    } finally {
      setLoadingReport(null);
    }
  };

  const reports = [
    { id: 'membros', title: 'Diretório de Membros', desc: 'Exportar lista completa de membros com contactos e cargos.', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'quotas_divida', title: 'Mapa de Quotas (Dívidas)', desc: 'Relatório de membros com pagamentos de quotas em atraso.', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'quotas_pagas', title: 'Mapa de Quotas (Pagas)', desc: 'Extrato de quotas pagas no ano corrente para contabilidade.', icon: CreditCard, color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'movimentos', title: 'Extrato Financeiro', desc: 'Fluxo completo de entradas e saídas de caixa do sindicato.', icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { id: 'auditoria', title: 'Logs de Auditoria', desc: 'Registo de ações de sistema dos utilizadores administrativos.', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="text-2xl font-bold">Mapas e Relatórios</h1>
        <p className="text-gray-500 text-sm mt-2">Geração e exportação de dados do sistema em formato PDF e Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const isLoadingPdf = loadingReport === `${report.id}-pdf`;
          const isLoadingExcel = loadingReport === `${report.id}-excel`;

          return (
            <div
              key={report.id}
              className="card flex items-start gap-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleExport(report.id, report.title, 'pdf')}
            >
              <div className={`p-4 rounded-xl ${report.bg} ${report.color}`}>
                <Icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{report.desc}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.id, report.title, 'pdf');
                    }}
                    disabled={isLoadingPdf || isLoadingExcel}
                    className="btn btn-outline text-sm py-1.5 px-3"
                  >
                    <Download size={14} /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.id, report.title, 'excel');
                    }}
                    disabled={isLoadingPdf || isLoadingExcel}
                    className="btn btn-outline text-sm py-1.5 px-3"
                  >
                    <Download size={14} /> Excel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Relatorios;
