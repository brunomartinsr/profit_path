'use client';

import { useState } from 'react';
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
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TradeModal from './trade-modal';
import CalendarDay from './calendar-day';

// Tipos de dados que o componente recebe
type DayData = { totalResult: number; tradeCount: number };

interface CalendarClientProps {
  initialDate: Date;
  dailyData: Map<string, DayData>;
}

export default function CalendarClient({ initialDate, dailyData }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  // Lógica para gerar a grelha de dias
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { locale: ptBR });
  const endDate = endOfWeek(lastDayOfMonth, { locale: ptBR });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}><ChevronsLeft className="h-5 w-5" /></Button>
        <h3 className="text-xl sm:text-2xl font-semibold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}><ChevronsRight className="h-5 w-5" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-center text-gray-400 font-medium text-xs sm:text-sm">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dataForDay = dailyData.get(dayKey);
          return (
            <CalendarDay
              key={index}
              day={day}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isToday(day)}
              onClick={() => handleDayClick(day)}
              financialResult={dataForDay?.totalResult || 0}
              tradeCount={dataForDay?.tradeCount || 0}
            />
          );
        })}
      </div>
      <TradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} day={selectedDay} />
    </div>
  );
}
