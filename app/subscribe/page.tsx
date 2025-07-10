import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { CheckIcon, CircleIcon, LogOutIcon } from 'lucide-react';
import { handleCheckout, signOutAndRedirect } from './actions';

export default async function SubscribePage() {
  // Como o middleware protege esta rota, podemos assumir que o utilizador está logado.
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Um último passo!</h1>
          <p className="text-gray-400 mt-2">
            Para destravar seu potencial e ter acesso a todas as funcionalidades, você precisa de uma assinatura ativa.
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
          <ul className="space-y-3">
            <li className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-400 mr-3" />
              <span>Registre trades ilimitados</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-400 mr-3" />
              <span>Visualize dashboards de performance</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-400 mr-3" />
              <span>Descubra sua vantagem no mercado</span>
            </li>
          </ul>
        </div>
        
        <form action={handleCheckout}>
            {/* Adicione um input hidden se precisar passar o priceId dinamicamente */}
            {/* <input type="hidden" name="priceId" value="price_xxxx" /> */}
            <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-lg transition-transform transform hover:scale-105"
            >
                Assinar Plano Premium - R$ 19,90/mês
            </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Cancele a qualquer momento.
        </p>

        <div className="border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
          <p>
            Logado como <span className="font-medium text-white">{user?.email}</span>.
          </p>
          <form action={signOutAndRedirect} className="inline-block">
             <button type="submit" className="underline hover:text-white mt-1">
                Não é você? Sair
             </button>
          </form>
        </div>
      </div>
    </div>
  );
}
