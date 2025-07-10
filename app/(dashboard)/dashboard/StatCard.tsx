import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  format?: 'currency' | 'rr' | 'percent' | 'default';
}

export default function StatCard({ title, value, icon: Icon, description, format = 'default' }: StatCardProps) {
  
  let formattedValue: string;
  let valueColor: string = 'text-white';

  const isPositive = value > 0;
  const isNegative = value < 0;

  if (format === 'currency' || format === 'rr') {
    if (isPositive) valueColor = 'text-green-400';
    if (isNegative) valueColor = 'text-red-400';
  }

  switch (format) {
    case 'currency':
      formattedValue = `${isPositive ? '+' : ''}${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`;
      break;
    case 'rr':
      formattedValue = `${isPositive ? '+' : ''}${value.toFixed(2)} R`;
      break;
    case 'percent':
      formattedValue = `${value.toFixed(1)}%`;
      break;
    case 'default':
    default:
      formattedValue = value.toString();
      break;
  }

  return (
    <Card className="bg-gray-800/70 border-gray-700 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{formattedValue}</div>
        {description && (
          <p className="text-xs text-gray-400 pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
