'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react'; // Importa o ícone

type CalendarDayProps = {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
  onViewDetails: () => void; // Nova propriedade para a ação do ícone
  financialResult?: number;
  tradeCount?: number;
};

export default function CalendarDay({
  day,
  isCurrentMonth,
  isToday,
  onClick,
  onViewDetails,
  financialResult = 0,
  tradeCount = 0,
}: CalendarDayProps) {
  const dayHasTrades = tradeCount > 0;
  const isPositive = dayHasTrades && financialResult > 0;
  const isNegative = dayHasTrades && financialResult < 0;

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no ícone abra o modal de adicionar trade
    onViewDetails();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex h-24 sm:h-32 flex-col p-2 border-t border-l border-gray-700 bg-gray-800 cursor-pointer transition-colors hover:bg-gray-700',
        {
          'text-gray-600': !isCurrentMonth,
          'text-gray-300': isCurrentMonth,
          'bg-sky-900/50 font-bold': isToday,
          'bg-green-900/20 border-green-500/30': isPositive,
          'bg-red-900/20 border-red-500/30': isNegative,
        }
      )}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-xs sm:text-sm font-medium ${
            isToday ? 'text-sky-300' : ''
          }`}
        >
          {format(day, 'd')}
        </span>
        {/* Adiciona o ícone se houver trades no dia */}
        {dayHasTrades && isCurrentMonth && (
          <button onClick={handleViewClick} className="z-10 p-1 rounded-full hover:bg-gray-600/50">
            <Eye className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {dayHasTrades && (
        <div className="mt-1 text-xs space-y-0.5 overflow-hidden">
          <p
            className={`font-semibold truncate ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(financialResult)}
          </p>
          <p className="text-gray-400">
            {tradeCount} {tradeCount === 1 ? 'trade' : 'trades'}
          </p>
        </div>
      )}
    </div>
  );
}
