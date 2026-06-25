import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Landmark, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const Transparencia = () => {
  const [data, setData] = useState(null);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const formatXOF = (val) => new Intl.NumberFormat('pt-GW', { style: 'currency', currency: 'XOF' }).format(val || 0);

  const fetchTransparencia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/financeiro/transparencia', { params: { ano: anoSelecionado } });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do portal de transparência');
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado]);

  useEffect(() => {
    fetchTransparencia();
  }, [fetchTransparencia]);

  const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const getEvolucaoData = () => {
    if (!data || !data.evolucaoMensal) return [];
    return data.evolucaoMensal.map(item => ({
      name: monthNamesShort[item.mes - 1],
      Receitas: item.receitas,
      Despesas: item.despesas,
      Saldo: item.saldo
    }));
  };

  const getPieData = (list) => {
    if (!list) return [];
    return list.map(item => ({
      name: item.categoria,
      value: item.total,
      color: item.cor || '#3b82f6'
    })).filter(item => item.value > 0);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        title="Portal de Transparência Financeira"
        subtitle="Acompanhe as receitas, despesas e a saúde financeira do sindicato de forma transparente"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Calendar size={16} className="text-slate-400" />
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="select-inline font-semibold"
            >
              {[new Date().getFullYear() - 3, new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner"></div>
        </div>
      ) : !data ? (
        <div className="card text-center py-10">
          <p style={{ color: 'var(--text-2)' }}>Não foi possível obter os dados financeiros.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receitas Anuais ({data.ano})</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatXOF(data.total_receitas).replace('XOF', '').trim()}</h3>
                  <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                    <ArrowUpRight size={14} /> Total arrecadado
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-green-600"><ArrowUpRight size={20} /></div>
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Despesas Anuais ({data.ano})</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatXOF(data.total_despesas).replace('XOF', '').trim()}</h3>
                  <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                    <ArrowDownRight size={14} /> Total investido/gasto
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-red-600"><ArrowDownRight size={20} /></div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Balanço do Ano</p>
                  <h3 className="text-2xl font-bold text-white">{formatXOF(data.saldo_anual).replace('XOF', '').trim()}</h3>
                  <p className="text-xs opacity-80 font-medium mt-2 flex items-center gap-1">
                    <TrendingUp size={14} /> Receitas menos despesas
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg"><DollarSign size={20} /></div>
              </div>
            </div>

            <div className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Saldo em Caixa</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatXOF(data.saldo_caixa).replace('XOF', '').trim()}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    Total disponível nas contas
                  </p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg text-amber-600"><Landmark size={20} /></div>
              </div>
            </div>
          </div>

          {/* Monthly Evolution Chart */}
          <div className="card">
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>Evolução Mensal (Receitas vs Despesas)</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={getEvolucaoData()} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-3)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-3)" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-1)'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Break Down */}
            <div className="card">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>Distribuição de Receitas</h3>
              {getPieData(data.receitasPorCategoria).length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  Sem receitas registadas este ano.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div style={{ width: '100%', height: 220, maxWidth: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={getPieData(data.receitasPorCategoria)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getPieData(data.receitasPorCategoria).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatXOF(value).replace('XOF', '').trim()} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {getPieData(data.receitasPorCategoria).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}></span>
                          <span style={{ color: 'var(--text-2)' }} className="font-medium">{item.name}</span>
                        </div>
                        <span style={{ color: 'var(--text-1)' }} className="font-bold">{formatXOF(item.value).replace('XOF', '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expense Break Down */}
            <div className="card">
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>Distribuição de Despesas</h3>
              {getPieData(data.despesasPorCategoria).length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  Sem despesas registadas este ano.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div style={{ width: '100%', height: 220, maxWidth: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={getPieData(data.despesasPorCategoria)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getPieData(data.despesasPorCategoria).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatXOF(value).replace('XOF', '').trim()} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {getPieData(data.despesasPorCategoria).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}></span>
                          <span style={{ color: 'var(--text-2)' }} className="font-medium">{item.name}</span>
                        </div>
                        <span style={{ color: 'var(--text-1)' }} className="font-bold">{formatXOF(item.value).replace('XOF', '').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Accounts Info */}
          <div className="card">
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>Contas e Depósitos Bancários</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.bancos.map((banco, idx) => (
                <div key={idx} className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{banco.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>Conta do Sindicato</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                    {formatXOF(banco.saldo_atual).replace('XOF', '').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Transparencia;
