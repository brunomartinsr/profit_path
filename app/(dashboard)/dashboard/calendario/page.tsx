import {
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { getTradesForMonth } from '@/lib/db/queries';
import CalendarClient from './calendar-client';

// Interface para os dados processados
type DayData = {
  totalResult: number;
  tradeCount: number;
};

export default async function CalendarioPage() {
  // No futuro, podemos obter a data a partir dos parâmetros da URL
  const currentDate = new Date(); 

  // 1. Buscamos os dados do banco de dados no servidor
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const tradesForMonth = await getTradesForMonth(firstDayOfMonth, lastDayOfMonth);

  // 2. Processamos os dados para agrupar por dia
  const dailyData = new Map<string, DayData>();
  for (const trade of tradesForMonth) {
    // Garantimos que a data seja tratada corretamente
    const tradeDate = new Date(trade.tradeDate + 'T00:00:00');
    const dayKey = format(tradeDate, 'yyyy-MM-dd');

    const existingData = dailyData.get(dayKey) || { totalResult: 0, tradeCount: 0 };

    existingData.tradeCount += 1;
    existingData.totalResult += parseFloat(trade.financialResult);

    dailyData.set(dayKey, existingData);
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">
          Calendário de Trades
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Clique em um dia para registrar um novo trade
        </p>

        {/* 3. Passamos os dados para o componente de cliente */}
        <CalendarClient initialDate={currentDate} dailyData={dailyData} />

      </div>
    </div>
  );
}