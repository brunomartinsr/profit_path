'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronsLeft, ChevronsRight, DollarSign, ListOrdered, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TradeModal from './trade-modal';
import CalendarDay from './calendar-day';
import DayTradesSidebar from './day-trades-sidebar';
import { DailyDataObject, TradesByDayObject, MonthlyStats } from './page';
import { Trade } from '@/lib/db/schema';

interface CalendarClientProps {
  initialDate: Date;
  initialDailyData: DailyDataObject;
  initialTradesByDay: TradesByDayObject;
  monthlyStats: MonthlyStats; // Nova prop para as métricas
}

// Componente de Card para as métricas
const StatCard = ({ title, value, icon: Icon, colorClass = 'text-white' }: { title: string; value: string | number; icon: React.ElementType; colorClass?: string; }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex items-center space-x-4">
        <div className={`p-2 bg-gray-700/50 rounded-lg ${colorClass}`}>
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        </div>
    </div>
);


export default function CalendarClient({ initialDate, initialDailyData, initialTradesByDay, monthlyStats }: CalendarClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);
  
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  const handleMonthChange = (newDate: Date) => {
    const month = newDate.getMonth() + 1;
    const year = newDate.getFullYear();
    router.push(`/dashboard/calendario?month=${month}&year=${year}`);
  };

  const goToNextMonth = () => handleMonthChange(addMonths(currentDate, 1));
  const goToPreviousMonth = () => handleMonthChange(subMonths(currentDate, 1));
  
  const handleDayClick = (day: Date) => {
    setIsSidebarOpen(false);
    setSelectedDay(day);
    setTradeToEdit(null);
    setIsModalOpen(true);
  };

  const handleViewDayDetails = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const tradesForDay = initialTradesByDay[dayKey] || [];
    setSelectedDay(day);
    setSelectedDayTrades(tradesForDay);
    setIsSidebarOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setIsSidebarOpen(false); 
    setSelectedDay(new Date(trade.tradeDate));
    setTradeToEdit(trade);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTradeToEdit(null);
    setSelectedDay(null);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { locale: ptBR }),
    end: endOfWeek(endOfMonth(currentDate), { locale: ptBR }),
  });
  const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="text-blue-400 hover:text-blue-300 hover:bg-gray-700/50">
          <ChevronsLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl sm:text-2xl font-semibold text-white capitalize">
          {format(currentDate, "LLLL 'de' yyyy", { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-blue-400 hover:text-blue-300 hover:bg-gray-700/50">
          <ChevronsRight className="h-5 w-5" />
        </Button>
      </div>

      {/* --- NOVA SESSÃO DE MÉTRICAS --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 border-b border-gray-700 pb-6">
        <StatCard 
            title="Resultado Total"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.totalResult)}
            icon={DollarSign}
            colorClass={monthlyStats.totalResult > 0 ? 'text-green-400' : monthlyStats.totalResult < 0 ? 'text-red-400' : 'text-gray-300'}
        />
        <StatCard 
            title="Trades no Mês"
            value={monthlyStats.totalTrades}
            icon={ListOrdered}
            colorClass="text-gray-300"
        />
        <StatCard 
            title="Vitórias"
            value={monthlyStats.totalWins}
            icon={TrendingUp}
            colorClass="text-green-400"
        />
        <StatCard 
            title="Derrotas"
            value={monthlyStats.totalLosses}
            icon={TrendingDown}
            colorClass="text-red-400"
        />
        <StatCard 
            title="R/R Total"
            value={`${monthlyStats.totalRR.toFixed(2)} R`}
            icon={BarChart}
            colorClass={monthlyStats.totalRR > 0 ? 'text-green-400' : monthlyStats.totalRR < 0 ? 'text-red-400' : 'text-gray-300'}
        />
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-center text-gray-400 font-medium text-xs sm:text-sm">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dataForDay = initialDailyData[dayKey];
          return (
            <CalendarDay
              key={dayKey}
              day={day}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isToday(day)}
              onClick={() => handleDayClick(day)}
              onViewDetails={() => handleViewDayDetails(day)}
              financialResult={dataForDay?.totalResult || 0}
              tradeCount={dataForDay?.tradeCount || 0}
            />
          );
        })}
      </div>
      <TradeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        day={selectedDay} 
        tradeToEdit={tradeToEdit}
      />
      <DayTradesSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        trades={selectedDayTrades}
        day={selectedDay}
        onEditTrade={handleEditTrade}
      />
    </div>
  );
}
