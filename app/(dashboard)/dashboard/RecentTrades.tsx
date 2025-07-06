import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade } from '@/lib/db/schema';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para formatar o resultado com cor e sinal
const formatResult = (result: string | null) => {
  if (result === null) return null;
  const value = parseFloat(result);
  const isPositive = value > 0;
  const isNegative = value < 0;

  const color = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-white';
  const sign = isPositive ? '+ ' : isNegative ? '- ' : '';
  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));

  return <span className={`font-mono font-semibold ${color}`}>{`${sign}${formattedValue}`}</span>;
};

interface RecentTradesProps {
  trades: Trade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  // Ordena os trades pela data mais recente e pega os últimos 5
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime())
    .slice(0, 5);

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">
          Últimos Trades Registrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTrades.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum trade registrado no período.</p>
        ) : (
          <ul className="space-y-4">
            {recentTrades.map((trade) => (
              <li key={trade.id} className="flex items-center justify-between pb-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <p className="font-semibold">{trade.asset}</p>
                  <p className="text-sm text-gray-400">
                    {/* parseISO é usado para garantir que a data seja interpretada corretamente */}
                    {format(parseISO(trade.tradeDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  {formatResult(trade.financialResult)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
