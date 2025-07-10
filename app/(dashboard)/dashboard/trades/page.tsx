import { getFilteredTrades } from '@/lib/db/queries';
import { Trade } from '@/lib/db/schema';
import TradesClientPage from './trades-client'; // Criaremos este a seguir

export const dynamic = 'force-dynamic';

export type PerformanceMetrics = {
  totalResult: number;
  winRate: number;
  lossRate: number;
  payoffRatio: number;
  averageTrade: number;
  totalTrades: number;
};

// Função para calcular as métricas de performance
function calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalResult: 0,
      winRate: 0,
      lossRate: 0,
      payoffRatio: 0,
      averageTrade: 0,
      totalTrades: 0,
    };
  }

  let totalResult = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalGain = 0;
  let totalLoss = 0;

  trades.forEach(trade => {
    const result = parseFloat(trade.financialResult);
    totalResult += result;

    if (result > 0) {
      totalWins++;
      totalGain += result;
    } else if (result < 0) {
      totalLosses++;
      totalLoss += Math.abs(result);
    }
  });

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (totalLosses / totalTrades) * 100 : 0;
  const averageWin = totalWins > 0 ? totalGain / totalWins : 0;
  const averageLoss = totalLosses > 0 ? totalLoss / totalLosses : 0;
  const payoffRatio = averageLoss > 0 ? averageWin / averageLoss : 0;
  const averageTrade = totalTrades > 0 ? totalResult / totalTrades : 0;

  return {
    totalResult,
    winRate,
    lossRate,
    payoffRatio,
    averageTrade,
    totalTrades,
  };
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;

  // Prepara os filtros a partir dos searchParams da URL
  const filters = {
    startDate: typeof resolvedSearchParams?.startDate === 'string' ? resolvedSearchParams.startDate : undefined,
    endDate: typeof resolvedSearchParams?.endDate === 'string' ? resolvedSearchParams.endDate : undefined,
    asset: typeof resolvedSearchParams?.asset === 'string' ? resolvedSearchParams.asset : undefined,
    resultType: typeof resolvedSearchParams?.resultType === 'string' ? resolvedSearchParams.resultType.split(',') : undefined,
    followedPlan: typeof resolvedSearchParams?.followedPlan === 'string' ? (resolvedSearchParams.followedPlan as 'sim' | 'nao') : undefined,
  };

  const trades = await getFilteredTrades(filters);
  const metrics = calculatePerformanceMetrics(trades);

  // A key garante que os componentes cliente sejam recriados quando os filtros mudam
  const pageKey = JSON.stringify(resolvedSearchParams) + trades.length;

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">
          Análise de Trades
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Filtre e analise a sua performance detalhadamente.
        </p>
        
        <TradesClientPage 
          key={pageKey}
          initialTrades={trades}
          initialMetrics={metrics}
          initialFilters={filters}
        />
      </div>
    </div>
  );
}