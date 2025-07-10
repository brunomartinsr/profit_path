'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { saveTrade } from './actions';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Trade } from '@/lib/db/schema';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: Date | null;
  tradeToEdit?: Trade | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white">
      {pending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Trade')}
    </Button>
  );
}

const parseDateWithoutTimezone = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function TradeModal({ isOpen, onClose, day, tradeToEdit }: TradeModalProps) {
  const isEditing = !!tradeToEdit;
  const initialState = { message: null, error: null, fieldErrors: null };
  const [state, formAction] = useActionState(saveTrade, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message && state.message.includes('sucesso')) {
      onClose();
    }
  }, [state, onClose]);

  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
    }
  }, [isOpen]);

  const tradeDate = tradeToEdit ? parseDateWithoutTimezone(tradeToEdit.tradeDate) : day;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md flex flex-col max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {isEditing ? 'Editar Trade' : `Registrar Novo Trade para ${tradeDate ? format(tradeDate, 'dd/MM/yyyy') : ''}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes da sua operação.' : 'Preencha os detalhes da sua operação.'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex-1 flex flex-col overflow-hidden">
          {isEditing && <input type="hidden" name="id" value={tradeToEdit.id} />}
          <input type="hidden" name="tradeDate" value={tradeDate ? format(tradeDate, 'yyyy-MM-dd') : ''} />
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Ativo</Label>
              <Input id="asset" name="asset" type="text" required defaultValue={tradeToEdit?.asset || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" />
              {state?.fieldErrors?.asset && <p className="text-xs text-red-400">{state.fieldErrors.asset[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="financialResult">Resultado Financeiro (R$)</Label>
              <Input id="financialResult" name="financialResult" type="number" step="0.01" required defaultValue={tradeToEdit?.financialResult || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" />
              {state?.fieldErrors?.financialResult && <p className="text-xs text-red-400">{state.fieldErrors.financialResult[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select name="resultType" required defaultValue={tradeToEdit?.resultType || undefined}>
                <SelectTrigger className="bg-gray-800 border-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectItem value="WIN" className="focus:bg-blue-900/50 focus:text-white">Win</SelectItem>
                  <SelectItem value="LOSS" className="focus:bg-blue-900/50 focus:text-white">Loss</SelectItem>
                  <SelectItem value="BE" className="focus:bg-blue-900/50 focus:text-white">BE</SelectItem>
                </SelectContent>
              </Select>
              {state?.fieldErrors?.resultType && <p className="text-xs text-red-400">{state.fieldErrors.resultType[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskRewardRatio">Risco/Retorno</Label>
              <Input id="riskRewardRatio" name="riskRewardRatio" type="text" placeholder="Ex: 1:2, 1:3..." defaultValue={tradeToEdit?.riskRewardRatio || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL do Print da Operação</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." defaultValue={tradeToEdit?.imageUrl || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"/>
            </div>
            <div className="space-y-3">
              <Label>Seguiu o Trading Plan?</Label>
              <RadioGroup name="followedPlan" defaultValue={tradeToEdit?.followedPlan ? 'sim' : 'nao'} className="flex flex-row space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="sim" className="border-gray-600 text-blue-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" />
                  <Label htmlFor="sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="nao" className="border-gray-600 text-blue-500 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" />
                  <Label htmlFor="nao">Não</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comentários</Label>
              <Textarea id="comment" name="comment" placeholder="Descreva a análise..." defaultValue={tradeToEdit?.comment || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emotions">Emoções</Label>
              <Textarea id="emotions" name="emotions" placeholder="Como se sentiu..." defaultValue={tradeToEdit?.emotions || ''} className="bg-gray-800 border-gray-600 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"/>
            </div>
          </div>

          <DialogFooter className="pt-4 mt-4 border-t border-gray-800">
            {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
