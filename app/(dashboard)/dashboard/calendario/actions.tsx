'use server';

import { db } from '@/lib/db/drizzle';
import { trades, trading_accounts } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

type FormState = {
  message?: string | null;
  error?: string | null;
  fieldErrors?: {
    [key:string]: string[] | undefined;
  } | null;
};

const saveTradeSchema = z.object({
  id: z.string().optional(), // O ID é opcional (presente apenas na edição)
  tradeDate: z.string().min(1, { message: 'A data é obrigatória.' }),
  asset: z.string().min(1, { message: 'O ativo é obrigatório.' }),
  financialResult: z.coerce.number(),
  resultType: z.enum(['WIN', 'LOSS', 'BE']),
  riskRewardRatio: z.string().optional(),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  followedPlan: z.enum(['sim', 'nao']).optional(),
  comment: z.string().optional(),
  emotions: z.string().optional(),
});

// Ação unificada para criar e atualizar trades
export async function saveTrade(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = saveTradeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: 'Erro de validação. Verifique os campos preenchidos.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, tradeDate, asset, financialResult, resultType, ...optionalFields } =
    validatedFields.data;

  try {
    const user = await getUser();
    if (!user) throw new Error('Utilizador não autenticado.');

    const dataToSave = {
      tradeDate: tradeDate,
      asset: asset,
      financialResult: financialResult.toString(),
      resultType: resultType,
      riskRewardRatio: optionalFields.riskRewardRatio,
      imageUrl: optionalFields.imageUrl,
      followedPlan: optionalFields.followedPlan === 'sim',
      comment: optionalFields.comment,
      emotions: optionalFields.emotions,
    };

    if (id) {
      // Modo de Edição: Atualiza o trade existente
      await db.update(trades).set(dataToSave).where(eq(trades.id, parseInt(id, 10)));
    } else {
      // Modo de Criação: Insere um novo trade
      let userTradingAccount = await db.query.trading_accounts.findFirst({
        where: (accounts, { eq }) => eq(accounts.userId, user.id),
      });

      if (!userTradingAccount) {
        const newAccount = await db.insert(trading_accounts).values({ userId: user.id, name: `${user.name || 'User'}'s Account` }).returning();
        userTradingAccount = newAccount[0];
      }
      
      await db.insert(trades).values({
        ...dataToSave,
        accountId: userTradingAccount.id,
      });
    }

    revalidatePath('/dashboard/calendario');
    revalidatePath('/dashboard'); // Revalida o dashboard também

    return { message: `Trade ${id ? 'atualizado' : 'registado'} com sucesso!` };
  } catch (error) {
    console.error('Erro ao salvar o trade:', error);
    return { error: 'Ocorreu um erro no servidor ao salvar o trade.' };
  }
}

// Nova ação para apagar um trade
export async function deleteTrade(
  previousState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const tradeId = formData.get('tradeId') as string;
  if (!tradeId) {
    return { error: 'ID do trade não encontrado.' };
  }

  try {
    await db.delete(trades).where(eq(trades.id, parseInt(tradeId, 10)));
    revalidatePath('/dashboard/calendario');
    revalidatePath('/dashboard/trades');
    revalidatePath('/dashboard');
    return {}; // Sucesso
  } catch (error) {
    console.error("Erro ao apagar o trade:", error);
    return { error: "Ocorreu um erro no servidor ao apagar o trade." };
  }
}
