'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Trade } from '@/lib/db/schema';
import { deleteTrade } from './actions';
import { useFormStatus } from 'react-dom';

interface DayTradesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  day: Date | null;
  onEditTrade: (trade: Trade) => void;
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      variant="outline" 
      size="sm" 
      disabled={pending}
      className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {pending ? 'Excluindo...' : 'Excluir'}
    </Button>
  );
}

// Componente para o modal da imagem em tela cheia
function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void; }) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
      >
        <X size={32} />
      </button>
      <img
        src={imageUrl}
        alt="Print da operação ampliado"
        // Impede que o clique na imagem feche o modal
        onClick={(e) => e.stopPropagation()} 
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}


export default function DayTradesSidebar({ isOpen, onClose, trades, day, onEditTrade }: DayTradesSidebarProps) {
  const [deleteState, deleteAction] = useActionState(deleteTrade, { error: undefined });
  
  // Estado para controlar a imagem ampliada
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Se a ação de apagar for bem sucedida, a recriação do componente pai já fecha a sidebar.
  // Não precisamos mais do useEffect para isso.

  return (
    <>
      {/* O modal da imagem só é renderizado quando uma URL é selecionada */}
      {zoomedImageUrl && (
        <ImageLightbox imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
      )}

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-3/4 lg:w-1/2 xl:w-1/3 bg-gray-900 border-l-gray-800 text-white overflow-y-auto p-0">
          <SheetHeader className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
            <SheetTitle className="text-white">
              Trades do dia {day ? format(day, 'dd/MM/yyyy', { locale: ptBR }) : ''}
            </SheetTitle>
          </SheetHeader>
          
          <div className="p-6 space-y-6">
            {trades.length > 0 ? (
              trades.map((trade) => (
                <div key={trade.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
                  
                  {trade.imageUrl && (
                    <div 
                      className="cursor-pointer"
                      onClick={() => setZoomedImageUrl(trade.imageUrl)}
                    >
                      <img 
                        src={trade.imageUrl} 
                        alt="Print da operação" 
                        className="w-full max-w-md rounded-lg transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Ativo:</span>
                      <p className="text-white font-medium">{trade.asset}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Resultado:</span>
                      <p className={`font-medium ${
                        parseFloat(trade.financialResult) > 0 ? 'text-green-400' : 
                        parseFloat(trade.financialResult) < 0 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        R$ {parseFloat(trade.financialResult).toFixed(2)}
                      </p>
                    </div>
                    
                    {/* CORREÇÃO: Adicionada a classe `break-words` para quebrar o texto */}
                    {trade.comment && (
                      <div>
                        <span className="text-gray-400">Comentários:</span>
                        <p className="text-gray-300 whitespace-pre-wrap pt-1 break-words">{trade.comment}</p>
                      </div>
                    )}
                    
                    {trade.emotions && (
                      <div>
                        <span className="text-gray-400">Emoções:</span>
                        <p className="text-gray-300 whitespace-pre-wrap pt-1 break-words">{trade.emotions}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700/50">
                    <Button 
                      onClick={() => onEditTrade(trade)} 
                      variant="outline" 
                      size="sm" 
                      className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    
                    <form action={deleteAction}>
                      <input type="hidden" name="tradeId" value={trade.id} />
                      <DeleteButton />
                    </form>
                  </div>
                  
                  {deleteState?.error && (
                    <p className="text-red-400 text-sm mt-2">{deleteState.error}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nenhum trade encontrado para este dia.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
