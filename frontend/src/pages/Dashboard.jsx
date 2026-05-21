import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, CreditCard, TrendingUp, UserPlus, 
  ArrowUpRight, ArrowDownRight, DollarSign, Activity, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/resumo');
        setData(response.data.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[60vh]"><div className="spinner"></div></div>;
  }

  if (!data) return <div>Erro ao carregar dados.</div>;

  const { membros, quotas, financeiro, membros_recentes, fluxo_mensal } = data;

  const formatXOF = (val) => new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(val);

  const formattedFluxo = (fluxo_mensal || []).map(item => ({
    ...item,
    receitas: Number(item.receitas || 0),
    despesas: Number(item.despesas || 0)
  }));

  const membrosDistribData = [
    { name: 'Ativos', value: Number(membros?.ativos || 0), color: '#10b981' },
    { name: 'Suspensos', value: Number(membros?.suspensos || 0), color: '#ef4444' },
    { name: 'Reformados', value: Number(membros?.reformados || 0), color: '#9ca3af' }
  ].filter(item => item.value > 0);

  return (
    <div className="fade-in space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
          <p className="text-slate-500 text-sm mt-1">Visão geral em tempo real</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-semibold">
          <Activity size={16} />
          Ano: {new Date().getFullYear()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total de Membros */}
        <div className="card overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Membros</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{membros.total}</h3>
              <p className="text-xs text-green-600 font-semibold mt-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {membros.ativos} ativos
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Quotas Cobradas */}
        <div className="card overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quotas Cobradas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {formatXOF(quotas.total_cobrado_ano).replace('XOF', '').trim()}
                <span className="text-sm text-slate-400 font-medium ml-1">XOF</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-3">{quotas.pagas} liquidadas</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        {/* Quotas em Dívida */}
        <div className="card overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dívida em Quotas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {formatXOF(quotas.total_divida_ano).replace('XOF', '').trim()}
                <span className="text-sm text-slate-400 font-medium ml-1">XOF</span>
              </h3>
              <p className="text-xs text-red-600 font-semibold mt-3 flex items-center gap-1">
                <ArrowDownRight size={14} />
                {quotas.pendentes} pendentes
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-red-600">
              <TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} />
            </div>
          </div>
        </div>

        {/* Saldo Mensal */}
        <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Saldo Mensal</p>
              <h3 className="text-2xl font-bold text-white mt-2">
                {formatXOF(financeiro.receitas_mes - financeiro.despesas_mes).replace('XOF', '').trim()}
                <span className="text-sm opacity-70 font-medium ml-1">XOF</span>
              </h3>
              <div className="flex gap-3 mt-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-green-200">
                  <ArrowUpRight size={14} /> {formatXOF(financeiro.receitas_mes).replace('XOF', '').trim()}
                </span>
                <span className="flex items-center gap-1 text-red-200">
                  <ArrowDownRight size={14} /> {formatXOF(financeiro.despesas_mes).replace('XOF', '').trim()}
                </span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Fluxo Financeiro Mensal
          </h3>
          <div className="min-h-80">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={formattedFluxo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="mes" 
                  tickFormatter={(val) => ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][val-1] || val} 
                  axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `${val / 1000}k`} 
                  axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                />
                <RechartsTooltip 
                  formatter={(value) => formatXOF(value)}
                  labelFormatter={(val) => `Mês: ${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][val-1] || val}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 500 }} />
                <Bar name="Receitas" dataKey="receitas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar name="Despesas" dataKey="despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-amber-600" />
            Distribuição de Membros
          </h3>
          <div className="min-h-80 flex items-center justify-center">
            {membrosDistribData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={membrosDistribData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {membrosDistribData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} membros`, 'Quantidade']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400">Sem dados suficientes</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
