import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/lib/db/schema'; // Importamos o tipo User

// Garante que a chave secreta está definida
const key = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!key) {
    throw new Error('AUTH_SECRET environment variable is not set');
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// A nossa nova SessionData inclui todas as propriedades do Utilizador (herdadas de User)
// e adicionamos as informações da assinatura e do time.
export type SessionData = User & {
  teamId?: number;
  subscriptionStatus: string;
  expires?: string; // Apenas para clareza de tipo, a biblioteca 'jose' trata da expiração
};

// Ela recebe um payload que corresponde ao nosso novo tipo SessionData.
export async function signToken(payload: Omit<SessionData, 'expires'>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string): Promise<SessionData> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  try {
    return await verifyToken(sessionCookie);
  } catch (error) {
    // Token inválido ou expirado
    return null;
  }
}

// A função aceita o nosso objeto de payload completo, que é criado em `actions.ts`.
// A sua única responsabilidade é encriptar o payload e definir o cookie.
export async function setSession(payload: Omit<SessionData, 'expires'>) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const encryptedSession = await signToken(payload);

  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/' // Garante que o cookie está disponível em todo o site
  });
}
