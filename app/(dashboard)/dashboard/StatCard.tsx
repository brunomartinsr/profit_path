import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number; // O valor agora é sempre um número
  icon: LucideIcon;
  description?: string;
  format?: 'currency' | 'rr' | 'percent' | 'default'; // Nova prop para definir a formatação
}

export default function StatCard({ title, value, icon: Icon, description, format = 'default' }: StatCardProps) {
  
  let formattedValue: string;
  let valueColor: string = 'text-white'; // Cor padrão

  const isPositive = value > 0;
  const isNegative = value < 0;

  // Define a cor com base no valor para os formatos 'currency' e 'rr'
  if (format === 'currency' || format === 'rr') {
    if (isPositive) valueColor = 'text-green-500';
    if (isNegative) valueColor = 'text-red-500';
  }

  // Define o sinal (+ ou -) e usa o valor absoluto para a formatação
  const sign = isPositive ? '+ ' : isNegative ? '- ' : '';
  const absValue = Math.abs(value);

  switch (format) {
    case 'currency':
      formattedValue = `${sign}${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(absValue)}`;
      break;
    case 'rr':
      formattedValue = `${sign}${absValue.toFixed(2)} R`;
      break;
    case 'percent':
      formattedValue = `${value.toFixed(2)}%`;
      break;
    case 'default':
    default:
      formattedValue = value.toString();
      break;
  }

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        {/* A cor é aplicada a todo o div, incluindo o sinal */}
        <div className={`text-2xl font-bold ${valueColor}`}>{formattedValue}</div>
        {description && (
          <p className="text-xs text-gray-500 pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
