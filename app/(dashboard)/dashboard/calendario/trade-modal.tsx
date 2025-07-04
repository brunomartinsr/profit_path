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
import { createTrade } from './actions';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: Date | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {pending ? 'Salvando...' : 'Salvar Trade'}
    </Button>
  );
}

export default function TradeModal({ isOpen, onClose, day }: TradeModalProps) {
  const initialState = { message: null, error: null, fieldErrors: null };
  const [state, formAction] = useActionState(createTrade, initialState);

  useEffect(() => {
    // Apenas fecha o modal em caso de sucesso
    if (state?.message) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {day ? `Registrar Novo Trade para ${format(day, 'dd/MM/yyyy')}` : 'Registrar Novo Trade'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua operação.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tradeDate" value={day ? format(day, 'yyyy-MM-dd') : ''} />
          
          <div className="space-y-2">
            <Label htmlFor="asset">Ativo</Label>
            <Input id="asset" name="asset" type="text" required />
            {state?.fieldErrors?.asset && <p className="text-xs text-red-400">{state.fieldErrors.asset[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="financialResult">Resultado Financeiro (R$)</Label>
            <Input id="financialResult" name="financialResult" type="number" step="0.01" required />
            {state?.fieldErrors?.financialResult && <p className="text-xs text-red-400">{state.fieldErrors.financialResult[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select name="resultType" required>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WIN">Win</SelectItem>
                <SelectItem value="LOSS">Loss</SelectItem>
                <SelectItem value="BE">BE</SelectItem>
              </SelectContent>
            </Select>
            {state?.fieldErrors?.resultType && <p className="text-xs text-red-400">{state.fieldErrors.resultType[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="riscoRetorno">Risco/Retorno</Label>
            <Input id="riscoRetorno" name="riscoRetorno" type="text" placeholder="Ex: 1:2, 1:3..."/>
          </div>
          <div className="space-y-3">
            <Label>Seguiu o Trading Plan?</Label>
            <RadioGroup name="seguiuPlano" className="flex flex-row space-x-6">
              <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="sim" /><Label htmlFor="sim">Sim</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="nao" /><Label htmlFor="nao">Não</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentários</Label>
            <Textarea id="comentarios" name="comentarios" placeholder="Descreva a análise..."/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emocoes">Emoções</Label>
            <Textarea id="emocoes" name="emocoes" placeholder="Como se sentiu..."/>
          </div>

          <DialogFooter className="pt-4">
            {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
