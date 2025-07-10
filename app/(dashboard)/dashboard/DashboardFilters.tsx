'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DashboardFiltersProps {
  activePeriod?: string;
  activeMonth?: string;
  activeYear?: string;
}

export default function DashboardFilters({
  activePeriod,
  activeMonth,
  activeYear,
}: DashboardFiltersProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>(activeYear || new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonth || (new Date().getMonth() + 1).toString());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  const handlePeriodFilterChange = (period: 'week' | 'month' | 'year') => {
    const params = new URLSearchParams();
    params.set('period', period);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleMonthFilterApply = () => {
    const params = new URLSearchParams();
    params.set('month', selectedMonth);
    params.set('year', selectedYear);
    router.push(`/dashboard?${params.toString()}`);
    setIsPopoverOpen(false);
  };

  const getButtonClasses = (period: string) => {
    if (activePeriod === period && !activeMonth) {
      return 'bg-blue-600 text-white hover:bg-blue-500';
    }
    return 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  const getCustomMonthButtonClasses = () => {
    if (activeMonth) {
      return 'bg-blue-600 text-white hover:bg-blue-500';
    }
    return 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={() => handlePeriodFilterChange('week')} className={getButtonClasses('week')}>Semana</Button>
      <Button onClick={() => handlePeriodFilterChange('month')} className={getButtonClasses('month')}>Mês</Button>
      <Button onClick={() => handlePeriodFilterChange('year')} className={getButtonClasses('year')}>Ano</Button>
      
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button className={getCustomMonthButtonClasses()}><CalendarIcon className="mr-2 h-4 w-4" /> Selecionar Mês</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 bg-gray-900 border-gray-700 text-white">
          <div className="space-y-4">
            <p className="font-semibold text-gray-200">Selecione o período</p>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] bg-gray-800 border-gray-600 text-gray-200 focus:ring-blue-600">
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  {months.map(month => <SelectItem key={month.value} value={month.value} className="focus:bg-blue-900/50 focus:text-white">{month.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] bg-gray-800 border-gray-600 text-gray-200 focus:ring-blue-600">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  {years.map(year => <SelectItem key={year} value={year} className="focus:bg-blue-900/50 focus:text-white">{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMonthFilterApply} className="w-full bg-blue-600 hover:bg-blue-500 text-white">Filtrar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
