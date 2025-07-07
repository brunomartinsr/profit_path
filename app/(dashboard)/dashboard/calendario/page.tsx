import {
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { getTradesForMonth } from '@/lib/db/queries';
import { Trade } from '@/lib/db/schema';
import CalendarClient from './calendar-client';

export type DayData = {
  totalResult: number;
  tradeCount: number;
};

export type TradesByDayObject = { [key: string]: Trade[] };
export type DailyDataObject = { [key: string]: DayData };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
}) {
  
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  
  // --- CORREÇÃO TURBOPACK ---
  const yearStr = resolvedSearchParams?.year;
  const monthStr = resolvedSearchParams?.month;

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
  }

  const calendarKey = `${year}-${month}-${tradesForMonth.length}`;

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
        />
      </div>
    </div>
  );
}