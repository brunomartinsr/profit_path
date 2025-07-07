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

export type DailyDataObject = { [key: string]: DayData };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: {
    month?: string;
    year?: string;
  };
}) {
  
  const month = searchParams?.month ? parseInt(searchParams.month) : new Date().getMonth() + 1;
  const year = searchParams?.year ? parseInt(searchParams.year) : new Date().getFullYear();
  const currentDate = new Date(year, month - 1, 1);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const tradesForMonth: Trade[] = await getTradesForMonth(firstDayOfMonth, lastDayOfMonth);

  const dailyData: DailyDataObject = {};
  for (const trade of tradesForMonth) {
    const dayKey = new Date(trade.tradeDate).toISOString().substring(0, 10);
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { totalResult: 0, tradeCount: 0 };
    }
    
    dailyData[dayKey].tradeCount += 1;
    dailyData[dayKey].totalResult += parseFloat(trade.financialResult || '0');
  }

  const calendarKey = `${year}-${month}-${tradesForMonth.length}`;

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">
          Calendário de Trades
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Clique em um dia para registrar um novo trade
        </p>

        <CalendarClient 
          key={calendarKey}
          initialDate={currentDate} 
          initialDailyData={dailyData} 
        />
      </div>
    </div>
  );
}
