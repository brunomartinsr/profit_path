'use server';

import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUserWithTeam } from '@/lib/db/queries';
import { getSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function handleCheckout(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return redirect('/sign-in');
  }

  // A nossa sessão já contém os dados do utilizador.
  const user = session;

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam || !userWithTeam.teamId) {
    throw new Error('Utilizador não encontrado ou não associado a um time.');
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, userWithTeam.teamId));

  if (!team) {
    throw new Error('O time associado ao utilizador não foi encontrado.');
  }

  const priceId = (formData.get('priceId') as string) || process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error('Price ID do Stripe não foi configurado.');
  }

  // Agora passamos o objeto 'user' para a função de checkout.
  const checkoutResult = await createCheckoutSession({
    team: team,
    user: user, // Passamos o utilizador que já temos
    priceId: priceId,
  });

  return checkoutResult;
}

export async function signOutAndRedirect() {
  (await cookies()).delete('session');
  redirect('/sign-in');
}
