import { getPerformanceStats } from '@/lib/db/queries';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import StatCard from './StatCard';
import PerformanceChart from './PerformanceChart';
import EquityCurveChart from './EquityCurveChart';
import RecentTrades from './RecentTrades';
import { DollarSign, Target, BarChart, TrendingUp } from 'lucide-react';
import DashboardFilters from './DashboardFilters';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: {
    period?: 'week' | 'month' | 'year';
    month?: string;
    year?: string;
  };
}) {
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date;

  const customMonth = searchParams?.month ? parseInt(searchParams.month) : null;
  const customYear = searchParams?.year ? parseInt(searchParams.year) : null;

  // Prioriza o filtro customizado de mês/ano
  if (customMonth && customYear && !isNaN(customMonth) && !isNaN(customYear)) {
    // O mês no objeto Date do JS é 0-indexado, por isso subtraímos 1
    const firstDay = new Date(customYear, customMonth - 1, 1);
    startDate = startOfMonth(firstDay);
    endDate = endOfMonth(firstDay);
  } else {
    // Se não houver filtro customizado, usa o filtro de período (semana, mês, ano)
    const period = searchParams?.period || 'month';
    switch (period) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'year':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'month':
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
  }

  const stats = await getPerformanceStats(startDate, endDate);

  const performanceChartData = [
    { name: 'Vitórias', value: stats.wins },
    { name: 'Derrotas', value: stats.losses },
    { name: 'Break Even', value: stats.breakEvens },
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white bg-gray-900 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400">
            A sua performance consolidada num só lugar.
          </p>
        </div>
        <DashboardFilters />
      </header>
      
      <main className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Resultado Total"
            value={stats.totalResult}
            icon={DollarSign}
            description="Resultado financeiro no período"
            format="currency"
          />
          <StatCard 
            title="Taxa de Acerto"
            value={stats.winRate}
            icon={Target}
            description={`${stats.wins} vitórias / ${stats.losses} derrotas`}
            format="percent"
          />
          <StatCard 
            title="Total de Trades"
            value={stats.totalTrades}
            icon={BarChart}
            description={`${stats.breakEvens} trades em Break-Even`}
          />
          <StatCard 
            title="Risco/Retorno (RR) Total"
            value={stats.totalRR}
            icon={TrendingUp}
            description="Soma dos R's ganhos e perdidos"
            format="rr"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <PerformanceChart data={performanceChartData} />
            <EquityCurveChart trades={stats.trades} />
        </div>

        <div>
          <RecentTrades trades={stats.trades} />
        </div>
      </main>
    </div>
  );
}
