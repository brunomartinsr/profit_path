'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

const COLORS = ['#22c55e', '#ef4444', '#a1a1aa'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">
          Desempenho dos Trades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel} 
                outerRadius={100} 
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                contentStyle={{
                  background: '#1f2937', // bg-gray-800
                  borderColor: '#374151', // border-gray-700
                  borderRadius: '0.5rem',
                }}
                itemStyle={{
                  color: '#d1d5db' // text-gray-300
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  color: '#a1a1aa', // text-zinc-400
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
