'use client';

// Imports from React and Next.js
import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Imports from date-fns for date manipulation
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

// Imports from shadcn/ui and other libraries
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, CalendarIcon, BarChart, TrendingUp, DollarSign, Percent, ListOrdered, Edit, Trash2 } from 'lucide-react';

// Imports from my own project
import { Trade } from '@/lib/db/schema';
import { PerformanceMetrics } from './page';
import TradeModal from '../calendario/trade-modal'; // Reusing the modal
import { deleteTrade } from '../calendario/actions'; // Importing the delete action

// Props interface for the component
interface TradesClientPageProps {
  initialTrades: Trade[];
  initialMetrics: PerformanceMetrics;
  initialFilters: {
    startDate?: string;
    endDate?: string;
    asset?: string;
    resultType?: string[];
    followedPlan?: 'sim' | 'nao';
  };
}

// Sub-component for displaying a single metric
const MetricCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card className="bg-gray-800/70 border-gray-700">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
    </CardContent>
  </Card>
);

// Card de métrica com cores dinâmicas para valores positivos/negativos
const ColoredMetricCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white';
    const formattedValue = `${isPositive ? '+' : ''}${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

    return (
        <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>{formattedValue}</div>
            </CardContent>
        </Card>
    );
};


// Diálogo de confirmação para exclusão
function DeleteConfirmationDialog({
  trade,
  onCancel,
  onDelete,
}: {
  trade: Trade;
  onCancel: () => void;
  onDelete: (formData: FormData) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem a certeza que deseja excluir o trade do ativo{' '}
            <span className="font-bold text-yellow-400">{trade.asset}</span> do dia{' '}
            <span className="font-bold text-yellow-400">{format(new Date(trade.tradeDate), 'dd/MM/yyyy')}</span>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <form action={onDelete}>
            <input type="hidden" name="tradeId" value={trade.id} />
            <Button type="submit" variant="destructive">Excluir</Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function TradesClientPage({
  initialTrades,
  initialMetrics,
  initialFilters,
}: TradesClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State for managing filters
  const [filters, setFilters] = useState(initialFilters);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialFilters.startDate ? new Date(initialFilters.startDate) : undefined,
    to: initialFilters.endDate ? new Date(initialFilters.endDate) : undefined,
  });

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  const handleFilterChange = (key: string, value: string | string[] | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    if (filters.asset) params.set('asset', filters.asset);
    if (filters.resultType && filters.resultType.length > 0) {
      params.set('resultType', filters.resultType.join(','));
    }
    if (filters.followedPlan) params.set('followedPlan', filters.followedPlan);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange(undefined);
    router.push(pathname);
  };

  const handleEditClick = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTradeToEdit(null);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  const totalPages = Math.ceil(initialTrades.length / tradesPerPage);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * tradesPerPage;
    return initialTrades.slice(startIndex, startIndex + tradesPerPage);
  }, [initialTrades, currentPage, tradesPerPage]);


  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-full justify-start text-left font-normal bg-gray-900 border-gray-600 hover:bg-gray-800 text-gray-200">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yy")) : <span>Selecione um período</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
                classNames={{
                  caption_label: "text-blue-300",
                  head_cell: "text-gray-400",
                  day: "text-gray-300",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-500 focus:bg-blue-600",
                  day_today: "bg-sky-800 text-sky-200",
                  day_range_middle: "aria-selected:bg-blue-900/50 aria-selected:text-white",
                  nav_button: "text-blue-400 hover:text-blue-300 hover:bg-gray-800",
                }}
              />
            </PopoverContent>
          </Popover>

          <Input placeholder="Filtrar por ativo..." value={filters.asset || ''} onChange={(e) => handleFilterChange('asset', e.target.value)} className="bg-gray-900 border-gray-600 text-white"/>

          <Select onValueChange={(value) => handleFilterChange('resultType', value === 'ALL' ? undefined : value.split(','))} defaultValue={filters.resultType?.join(',') || 'ALL'}>
            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="ALL" className="focus:bg-blue-900/50 focus:text-white">Todos Resultados</SelectItem>
                <SelectItem value="WIN" className="focus:bg-blue-900/50 focus:text-white">Win</SelectItem>
                <SelectItem value="LOSS" className="focus:bg-blue-900/50 focus:text-white">Loss</SelectItem>
                <SelectItem value="BE" className="focus:bg-blue-900/50 focus:text-white">Break Even</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => handleFilterChange('followedPlan', value === 'ALL' ? undefined : value as 'sim' | 'nao')} defaultValue={filters.followedPlan || 'ALL'}>
            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                <SelectItem value="ALL" className="focus:bg-blue-900/50 focus:text-white">Plano (Todos)</SelectItem>
                <SelectItem value="sim" className="focus:bg-blue-900/50 focus:text-white">Sim</SelectItem>
                <SelectItem value="nao" className="focus:bg-blue-900/50 focus:text-white">Não</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={clearFilters} className="text-gray-300 hover:text-white hover:bg-gray-700/50">Limpar</Button>
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-500 text-white">Filtrar</Button>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ColoredMetricCard title="Resultado Total" value={initialMetrics.totalResult} icon={DollarSign} />
        <MetricCard title="Taxa de Acerto" value={`${initialMetrics.winRate.toFixed(1)}%`} icon={Percent} />
        <MetricCard title="Payoff Ratio" value={initialMetrics.payoffRatio.toFixed(2)} icon={BarChart} />
        <ColoredMetricCard title="Trade Médio" value={initialMetrics.averageTrade} icon={TrendingUp} />
        <MetricCard title="Total de Trades" value={initialMetrics.totalTrades} icon={ListOrdered} />
      </div>

      {/* Trades Table Section */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700">
        <Table>
          <TableCaption>Lista dos seus trades recentes. {initialTrades.length === 0 && 'Nenhum trade encontrado para os filtros selecionados.'}</TableCaption>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800/60">
              <TableHead className="text-gray-300">Data</TableHead>
              <TableHead className="text-gray-300">Ativo</TableHead>
              <TableHead className="text-gray-300">Resultado (R$)</TableHead>
              <TableHead className="text-gray-300">Tipo</TableHead>
              <TableHead className="text-gray-300">Plano</TableHead>
              <TableHead className="text-right text-gray-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => (
              <TableRow key={trade.id} className="border-gray-700">
                <TableCell className="text-gray-400">{format(new Date(trade.tradeDate), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="font-medium text-gray-200">{trade.asset}</TableCell>
                <TableCell className={parseFloat(trade.financialResult) > 0 ? 'text-green-400' : parseFloat(trade.financialResult) < 0 ? 'text-red-400' : 'text-gray-300'}>
                  {parseFloat(trade.financialResult).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-gray-400">{trade.resultType}</TableCell>
                <TableCell className="text-gray-400">{trade.followedPlan ? 'Sim' : 'Não'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-black">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-gray-200">
                      <DropdownMenuItem onClick={() => handleEditClick(trade)} className="focus:bg-blue-900/50 focus:text-white">
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setTradeToDelete(trade)} className="text-red-500 focus:text-red-400 focus:bg-red-500/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
          <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
        </div>
      </div>

      {/* Edit Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        day={tradeToEdit ? new Date(tradeToEdit.tradeDate) : null}
        tradeToEdit={tradeToEdit}
      />

      {/* Delete Confirmation Dialog */}
      {tradeToDelete && (
        <DeleteConfirmationDialog
          trade={tradeToDelete}
          onCancel={() => setTradeToDelete(null)}
          onDelete={async (formData) => {
            await deleteTrade({}, formData);
            setTradeToDelete(null);
          }}
        />
      )}
    </div>
  );
}
