import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    // Se não houver ID de sessão, redireciona para a página de preços.
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Dados de cliente inválidos do Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('Nenhuma assinatura encontrada para esta sessão.');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error('Nenhum plano encontrado para esta assinatura.');
    }

    const productId = (plan.product as Stripe.Product).id;

    if (!productId) {
      throw new Error('Nenhum ID de produto encontrado para esta assinatura.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("Nenhum ID de utilizador encontrado no client_reference_id da sessão.");
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error('Utilizador não encontrado na base de dados.');
    }
    const foundUser = userResult[0];

    const userTeamResult = await db
      .select({
        teamId: teamMembers.teamId,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, foundUser.id))
      .limit(1);

    if (userTeamResult.length === 0) {
      throw new Error('Utilizador não está associado a nenhum time.');
    }
    const foundTeam = userTeamResult[0];

    // Atualiza a tabela 'teams' com os dados da assinatura do Stripe.
    await db
      .update(teams)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeProductId: productId,
        planName: (plan.product as Stripe.Product).name,
        subscriptionStatus: subscription.status, // 'trialing' ou 'active'
        updatedAt: new Date(),
      })
      .where(eq(teams.id, foundTeam.teamId));

    //payload da sessão com todas as informações necessárias.
    const sessionPayload = {
      ...foundUser,
      teamId: foundTeam.teamId,
      subscriptionStatus: subscription.status, // Usamos o status que acabámos de guardar
    };

    // Agora, a chamada a setSession tem os dados corretos.
    await setSession(sessionPayload);
    
    // Redireciona para o dashboard, onde o utilizador terá acesso.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Erro ao processar o checkout bem-sucedido:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
