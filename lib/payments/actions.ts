'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';
import { getUser } from '@/lib/db/queries';//Importamos a função para obter o utilizador

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  
  // obtem o utilizador atual a partir da sessão
  const user = await getUser();
  if (!user) {
    // Se não houver utilizador, redireciona para o login (embora o middleware já deva fazer isto)
    return redirect('/sign-in');
  }

  await createCheckoutSession({ team: team, user: user, priceId });
});

export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
