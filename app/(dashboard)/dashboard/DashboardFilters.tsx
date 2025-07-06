'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtém os filtros ativos a partir do URL
  const activePeriod = searchParams.get('period');
  const activeMonth = searchParams.get('month');
  const activeYear = searchParams.get('year');

  // Estado para o seletor do popover
  const [selectedYear, setSelectedYear] = useState<string>(activeYear || new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonth || (new Date().getMonth() + 1).toString());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Gera uma lista de anos para o dropdown
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
    const params = new URLSearchParams(); // Começa com parâmetros limpos para remover os de mês/ano
    params.set('period', period);
    router.push(`?${params.toString()}`);
  };

  const handleMonthFilterApply = () => {
    const params = new URLSearchParams(); // Começa com parâmetros limpos para remover os de período
    params.set('month', selectedMonth);
    params.set('year', selectedYear);
    router.push(`?${params.toString()}`);
    setIsPopoverOpen(false); // Fecha o popover após aplicar
  };

  const getButtonClasses = (period: string) => {
    // Destaca se for o período ativo E não houver um mês customizado selecionado
    if (activePeriod === period && !activeMonth) {
      return 'bg-gray-700 text-white hover:bg-gray-600';
    }
    return 'bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white';
  };

  const getCustomMonthButtonClasses = () => {
    // Destaca se houver um mês customizado selecionado
    if (activeMonth) {
      return 'bg-gray-700 text-white hover:bg-gray-600';
    }
    return 'bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white';
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
        <PopoverContent className="w-auto p-4 bg-gray-800 border-gray-700 text-white">
          <div className="space-y-4">
            <p className="font-semibold">Selecione o período</p>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMonthFilterApply} className="w-full">Filtrar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
