import {
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { getTradesForMonth } from '@/lib/db/queries';
import { Trade } from '@/lib/db/schema';
import CalendarClient from './calendar-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ListOrdered, TrendingUp, TrendingDown, BarChart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export type DayData = {
  totalResult: number;
  tradeCount: number;
};

export type TradesByDayObject = { [key: string]: Trade[] };
export type DailyDataObject = { [key: string]: DayData };

// --- NOVO TIPO ---
// Define a estrutura para as estatísticas do mês
export type MonthlyStats = {
  totalResult: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalRR: number;
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
}) {
  
  const resolvedSearchParams = await searchParams || {};
  const { year: yearStr, month: monthStr } = resolvedSearchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (yearStr) {
    const parsedYear = parseInt(yearStr, 10);
    if (!isNaN(parsedYear)) {
      year = parsedYear;
    }
  }

  if (monthStr) {
    const parsedMonth = parseInt(monthStr, 10);
    if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      month = parsedMonth;
    }
  }
  
  const currentDate = new Date(year, month - 1, 1);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const tradesForMonth: Trade[] = await getTradesForMonth(firstDayOfMonth, lastDayOfMonth);

  const dailyData: DailyDataObject = {};
  const tradesByDay: TradesByDayObject = {};
  
  // --- NOVO CÁLCULO DE MÉTRICAS ---
  const monthlyStats: MonthlyStats = {
    totalResult: 0,
    totalTrades: tradesForMonth.length,
    totalWins: 0,
    totalLosses: 0,
    totalRR: 0,
  };

  for (const trade of tradesForMonth) {
    const dayKey = new Date(trade.tradeDate).toISOString().substring(0, 10);
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { totalResult: 0, tradeCount: 0 };
    }
    if (!tradesByDay[dayKey]) {
      tradesByDay[dayKey] = [];
    }
    
    dailyData[dayKey].tradeCount += 1;
    dailyData[dayKey].totalResult += parseFloat(trade.financialResult || '0');
    tradesByDay[dayKey].push(trade);

    // Acumula as estatísticas do mês
    monthlyStats.totalResult += parseFloat(trade.financialResult || '0');
    if (trade.resultType === 'WIN') monthlyStats.totalWins++;
    if (trade.resultType === 'LOSS') monthlyStats.totalLosses++;
    
    if (trade.riskRewardRatio && trade.riskRewardRatio.includes(':')) {
        const parts = trade.riskRewardRatio.split(':');
        const reward = parseFloat(parts[1]);
        if (!isNaN(reward)) {
            if (trade.resultType === 'WIN') monthlyStats.totalRR += reward;
            else if (trade.resultType === 'LOSS') monthlyStats.totalRR -= 1;
        }
    }
  }

  const calendarKey = Date.now().toString();

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">
          Calendário de Trades
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Clique em um dia para adicionar um trade ou no ícone para ver detalhes.
        </p>

        <CalendarClient 
          key={calendarKey}
          initialDate={currentDate} 
          initialDailyData={dailyData}
          initialTradesByDay={tradesByDay}
          monthlyStats={monthlyStats} // Passa as novas métricas
        />
      </div>
    </div>
  );
}
