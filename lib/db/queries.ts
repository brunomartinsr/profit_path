import { desc, and, eq, isNull, gte, lte } from 'drizzle-orm';
import { db } from './drizzle'; // Supondo que o seu ficheiro drizzle esteja aqui
import { activityLogs, teamMembers, teams, users, trades, trading_accounts } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session'; // O caminho pode variar

// --- FUNÇÕES PADRÃO  ---

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getTradesForMonth(startDate: Date, endDate: Date) {
  const user = await getUser();
  if (!user) return [];

  const userTradingAccount = await db.query.trading_accounts.findFirst({
    where: eq(trading_accounts.userId, user.id),
  });

  if (!userTradingAccount) return [];

  const monthTrades = await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.accountId, userTradingAccount.id),
        gte(trades.tradeDate, startDate.toISOString().split('T')[0]),
        lte(trades.tradeDate, endDate.toISOString().split('T')[0])
      )
    );

  return monthTrades;
}

// --- FUNÇÃO PARA O DASHBOARD ---

/**
 * Busca e calcula as estatísticas de performance para o utilizador autenticado num dado período.
 * @param startDate - A data de início do período.
 * @param endDate - A data de fim do período.
 * @returns Um objeto com todas as métricas de performance calculadas.
 */
export async function getPerformanceStats(startDate: Date, endDate: Date) {
  const user = await getUser();
  // Se não houver utilizador, retorna um objeto com valores padrão.
  if (!user) {
    return { totalResult: 0, totalTrades: 0, wins: 0, losses: 0, breakEvens: 0, winRate: 0, totalRR: 0, trades: [] };
  }

  // Encontra a conta de trading do utilizador, seguindo o padrão do seu projeto.
  const userTradingAccount = await db.query.trading_accounts.findFirst({
    where: eq(trading_accounts.userId, user.id),
  });
  
  // Se não houver conta, retorna valores padrão.
  if (!userTradingAccount) {
    return { totalResult: 0, totalTrades: 0, wins: 0, losses: 0, breakEvens: 0, winRate: 0, totalRR: 0, trades: [] };
  }

  const allTradesInPeriod = await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.accountId, userTradingAccount.id),
        gte(trades.tradeDate, startDate.toISOString().split('T')[0]),
        lte(trades.tradeDate, endDate.toISOString().split('T')[0])
      )
    );

  // 1. Inicializar as métricas
  let totalResult = 0;
  let totalTrades = allTradesInPeriod.length;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  let totalRR = 0;

  // 2. Iterar sobre cada trade para calcular as métricas
  for (const trade of allTradesInPeriod) {
    totalResult += parseFloat(trade.financialResult || '0');

    if (trade.resultType === 'WIN') wins++;
    else if (trade.resultType === 'LOSS') losses++;
    else if (trade.resultType === 'BE') breakEvens++;

    //  Risco/Retorno Total
    if (trade.riskRewardRatio && trade.riskRewardRatio.includes(':')) {
      const parts = trade.riskRewardRatio.split(':');
      const reward = parseFloat(parts[1]);
      
      if (!isNaN(reward)) {
        if (trade.resultType === 'WIN') {
          totalRR += reward; // Adiciona o retorno no WIN
        } else if (trade.resultType === 'LOSS') {
          totalRR -= 1; // Subtrai 1R (risco) no LOSS
        }
      }
    }
  }

  // Taxa de Acerto
  const tradesConsideredForWinRate = wins + losses;
  const winRate = tradesConsideredForWinRate > 0 ? (wins / tradesConsideredForWinRate) * 100 : 0;

  // 4. Retornar o objeto com todas as estatísticas
  return {
    totalResult,
    totalTrades,
    wins,
    losses,
    breakEvens,
    winRate,
    totalRR,
    trades: allTradesInPeriod
  };
}
