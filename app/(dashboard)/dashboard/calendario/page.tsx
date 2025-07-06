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

// Usamos um objeto simples em vez de um Map para evitar problemas de serialização
export type DailyDataObject = { [key: string]: DayData };

export default async function CalendarioPage() {
  const currentDate = new Date(); 

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const tradesForMonth: Trade[] = await getTradesForMonth(firstDayOfMonth, lastDayOfMonth);

  const dailyData: DailyDataObject = {};
  for (const trade of tradesForMonth) {
    const dayKey = trade.tradeDate; // A data já vem como 'yyyy-MM-dd'
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { totalResult: 0, tradeCount: 0 };
    }
    
    dailyData[dayKey].tradeCount += 1;
    dailyData[dayKey].totalResult += parseFloat(trade.financialResult);
  }

  // AQUI ESTÁ A SOLUÇÃO DEFINITIVA:
  // Criamos uma chave única baseada no número de trades.
  // Quando um novo trade é adicionado, esta chave muda (ex: de 5 para 6),
  // forçando o React a destruir o CalendarClient antigo e a renderizar um novo do zero.
  const calendarKey = tradesForMonth.length;

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
