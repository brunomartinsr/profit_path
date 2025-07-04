'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // O starter kit geralmente tem esta função utilitária para juntar classes do Tailwind.

// 1. Definimos o nosso "contrato" de propriedades.
// Note que agora recebemos o objeto 'day' completo.
type CalendarDayProps = {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
  financialResult?: number;
  tradeCount?: number;
};

export default function CalendarDay({
  day,
  isCurrentMonth,
  isToday,
  onClick,
  financialResult = 0,
  tradeCount = 0,
}: CalendarDayProps) {
  const dayHasTrades = tradeCount > 0;
  const isPositive = dayHasTrades && financialResult > 0;
  const isNegative = dayHasTrades && financialResult < 0;

  // 2. Usamos a função 'cn' para juntar as classes de forma mais limpa e condicional.
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex h-24 sm:h-32 flex-col p-2 border-t border-l border-gray-700 bg-gray-800 cursor-pointer transition-colors hover:bg-gray-700',
        {
          'text-gray-600': !isCurrentMonth, // Cor diferente para dias de outros meses
          'text-gray-300': isCurrentMonth, // Cor padrão para dias do mês atual
          'bg-sky-900/50 font-bold': isToday, // Destaca o dia de hoje
          'bg-green-900/20 border-green-500/30': isPositive,
          'bg-red-900/20 border-red-500/30': isNegative,
        }
      )}
    >
      <span
        className={`text-xs sm:text-sm font-medium ${
          isToday ? 'text-sky-300' : ''
        }`}
      >
        {/* 3. Usamos format(day, 'd') para extrair o número do dia do objeto Date */}
        {format(day, 'd')}
      </span>

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
