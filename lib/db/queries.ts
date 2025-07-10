import { desc, and, eq, isNull, gte, lte, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, trades, trading_accounts } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

// --- FUNÇÃO GETUSER CORRIGIDA ---
export async function getUser() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    // A função verifyToken já trata da validação e expiração.
    // Se o token for inválido, ela lançará um erro.
    const sessionData = await verifyToken(sessionCookie);

    // Após a verificação, a nossa sessão é o próprio utilizador.
    // Verificamos se temos um ID, que é o essencial.
    if (!sessionData || typeof sessionData.id !== 'number') {
      return null;
    }

    // Buscamos o utilizador na base de dados usando o ID da sessão.
    const userResult = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.id), isNull(users.deletedAt)))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    return userResult[0];
  } catch (error) {
    // Se verifyToken falhar (ex: token expirado), a sessão é inválida.
    console.error("Falha ao obter utilizador, sessão inválida:", error);
    return null;
  }
}

// --- RESTO DO SEU ARQUIVO ---

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

export async function getPerformanceStats(startDate: Date, endDate: Date) {
  const user = await getUser();
  if (!user) {
    return { totalResult: 0, totalTrades: 0, wins: 0, losses: 0, breakEvens: 0, winRate: 0, totalRR: 0, trades: [] };
  }

  const userTradingAccount = await db.query.trading_accounts.findFirst({
    where: eq(trading_accounts.userId, user.id),
  });
  
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

  let totalResult = 0;
  let totalTrades = allTradesInPeriod.length;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  let totalRR = 0;

  for (const trade of allTradesInPeriod) {
    totalResult += parseFloat(trade.financialResult || '0');

    if (trade.resultType === 'WIN') wins++;
    else if (trade.resultType === 'LOSS') losses++;
    else if (trade.resultType === 'BE') breakEvens++;

    if (trade.riskRewardRatio && trade.riskRewardRatio.includes(':')) {
      const parts = trade.riskRewardRatio.split(':');
      const reward = parseFloat(parts[1]);
      
      if (!isNaN(reward)) {
        if (trade.resultType === 'WIN') {
          totalRR += reward;
        } else if (trade.resultType === 'LOSS') {
          totalRR -= 1;
        }
      }
    }
  }

  const tradesConsideredForWinRate = wins + losses;
  const winRate = tradesConsideredForWinRate > 0 ? (wins / tradesConsideredForWinRate) * 100 : 0;

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

export async function getFilteredTrades(filters: {
  startDate?: string;
  endDate?: string;
  asset?: string;
  resultType?: string[];
  followedPlan?: 'sim' | 'nao';
}) {
  const user = await getUser();
  if (!user) return [];

  const userTradingAccount = await db.query.trading_accounts.findFirst({
    where: eq(trading_accounts.userId, user.id),
  });

  if (!userTradingAccount) {
    return [];
  }

  const whereConditions = [eq(trades.accountId, userTradingAccount.id)];

  if (filters.startDate) {
    whereConditions.push(gte(trades.tradeDate, filters.startDate));
  }
  if (filters.endDate) {
    whereConditions.push(lte(trades.tradeDate, filters.endDate));
  }
  if (filters.asset) {
    whereConditions.push(sql`lower(${trades.asset}) like ${'%' + filters.asset.toLowerCase() + '%'}`);
  }
  if (filters.resultType && filters.resultType.length > 0) {
    // @ts-ignore
    whereConditions.push(sql`${trades.resultType} in ${filters.resultType}`);
  }
  if (filters.followedPlan) {
    whereConditions.push(eq(trades.followedPlan, filters.followedPlan === 'sim'));
  }

  const filteredTrades = await db.query.trades.findMany({
    where: and(...whereConditions),
    orderBy: (trades, { desc }) => [desc(trades.tradeDate)],
  });

  return filteredTrades;
}

// --- NOVAS FUNÇÕES ADICIONADAS ---

export async function getTeamByUserId(userId: number) {
  const userWithTeam = await db
    .select({
      team: teams
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  return userWithTeam.length > 0 ? userWithTeam[0].team : null;
}

export async function updateTeam(
  teamId: number,
  data: Partial<typeof teams.$inferInsert>
) {
  const [updatedTeam] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, teamId))
    .returning();

  return updatedTeam;
}
