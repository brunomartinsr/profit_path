'use server';

import { db } from '@/lib/db/drizzle';
import { trades, trading_accounts } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Definimos o tipo para o estado do nosso formulário
type FormState = {
  message?: string | null;
  error?: string | null;
  fieldErrors?: {
    [key: string]: string[] | undefined;
  } | null;
};

const createTradeSchema = z.object({
  tradeDate: z.string().min(1, { message: 'A data é obrigatória.' }),
  asset: z.string().min(1, { message: 'O ativo é obrigatório.' }),
  financialResult: z.coerce.number({
    invalid_type_error: 'O resultado financeiro deve ser um número.',
  }),
  resultType: z.enum(['WIN', 'LOSS', 'BE'], {
    errorMap: () => ({ message: 'Selecione um resultado válido.' }),
  }),
  riskRewardRatio: z.string().optional(),
  followedPlan: z.enum(['sim', 'nao']).optional(),
  comment: z.string().optional(),
  emotions: z.string().optional(),
});

// 1. AQUI ESTÁ A CORREÇÃO PRINCIPAL:
// A função agora aceita 'previousState' como o primeiro argumento.
export async function createTrade(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  // Extrair os dados do FormData
  const rawData = {
    tradeDate: formData.get('tradeDate'),
    asset: formData.get('asset'),
    financialResult: formData.get('financialResult'),
    resultType: formData.get('resultType'),
    riskRewardRatio: formData.get('riscoRetorno'),
    followedPlan: formData.get('seguiuPlano'),
    comment: formData.get('comentarios'),
    emotions: formData.get('emocoes'),
  };

  const validatedFields = createTradeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Erro de validação. Verifique os campos preenchidos.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { tradeDate, asset, financialResult, resultType, ...optionalFields } =
    validatedFields.data;

  try {
    const user = await getUser();
    const team = await getTeamForUser();

    if (!user || !team) {
      throw new Error('Utilizador não autenticado.');
    }

    let userTradingAccount = await db.query.trading_accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (!userTradingAccount) {
      const newAccount = await db
        .insert(trading_accounts)
        .values({
          userId: user.id,
          name: `${user.name || 'User'}'s Account`,
        })
        .returning();

      userTradingAccount = newAccount[0];
    }

    await db.insert(trades).values({
      accountId: userTradingAccount.id,
      tradeDate: new Date(tradeDate).toISOString(),
      asset: asset,
      financialResult: financialResult.toString(),
      resultType: resultType,
      riskRewardRatio: optionalFields.riskRewardRatio,
      followedPlan: optionalFields.followedPlan === 'sim',
      comment: optionalFields.comment,
      emotions: optionalFields.emotions,
    });

    revalidatePath('/dashboard/calendario');

    return { message: 'Trade registado com sucesso!' };
  } catch (error) {
    console.error('Erro ao criar o trade:', error);
    return {
      error: 'Ocorreu um erro no servidor ao registar o trade.',
    };
  }
}
