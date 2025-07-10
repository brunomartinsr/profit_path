//Arquivo page do Dashboard, cujo caminho completo é app/(dashboard)/dashboard/page.tsx
import { getPerformanceStats } from '@/lib/db/queries';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import StatCard from './StatCard';
import PerformanceChart from './PerformanceChart';
import EquityCurveChart from './EquityCurveChart';
import RecentTrades from './RecentTrades';
import { DollarSign, Target, BarChart, TrendingUp } from 'lucide-react';
import DashboardFilters from './DashboardFilters';

// A linha abaixo pode ser removida se o erro desaparecer, mas é seguro mantê-la.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    period?: 'week' | 'month' | 'year';
    month?: string;
    year?: string;
  }>;
}) {
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date;

  const { year: yearStr, month: monthStr, period: periodStr } = resolvedSearchParams || {};

  const customYear = yearStr ? parseInt(yearStr, 10) : NaN;
  const customMonth = monthStr ? parseInt(monthStr, 10) : NaN;
  
  if (!isNaN(customYear) && !isNaN(customMonth) && customMonth >= 1 && customMonth <= 12) {
    const firstDay = new Date(customYear, customMonth - 1, 1);
    startDate = startOfMonth(firstDay);
    endDate = endOfMonth(firstDay);
  } else {
    const period = (periodStr === 'week' || periodStr === 'year') ? periodStr : 'month';
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
    { name: 'Take', value: stats.wins },
    { name: 'Loss', value: stats.losses },
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
        {/* Passamos os filtros ativos como props */}
        <DashboardFilters 
          activePeriod={periodStr}
          activeMonth={monthStr}
          activeYear={yearStr}
        />
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
            description={`${stats.wins} Take / ${stats.losses} Loss`}
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