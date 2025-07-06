'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trade } from '@/lib/db/schema'; // Importa o tipo Trade

interface EquityCurveChartProps {
  trades: Trade[];
}

// Função para formatar moeda no Tooltip
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function EquityCurveChart({ trades }: EquityCurveChartProps) {
  // Processa os dados para criar a curva de patrimônio
  const equityData = trades.reduce((acc, trade, index) => {
    const previousResult = index > 0 ? acc[index - 1].resultado : 0;
    const currentResult = previousResult + parseFloat(trade.financialResult || '0');
    acc.push({
      name: `Trade ${index + 1}`,
      resultado: currentResult,
    });
    return acc;
  }, [] as { name: string; resultado: number }[]);

  return (
    <Card className="bg-gray-800 border-gray-700 text-white h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">
          Curva de Patrimônio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={equityData}
              margin={{
                top: 5,
                right: 20,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Line type="monotone" dataKey="resultado" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
