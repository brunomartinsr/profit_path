import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const DASHBOARD_PATH = '/dashboard';
const SUBSCRIBE_PATH = '/subscribe';
const SIGN_IN_PATH = '/sign-in';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = pathname.startsWith(DASHBOARD_PATH);
  const isSubscribePage = pathname === SUBSCRIBE_PATH;

  if (isProtectedRoute) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
    }

    try {
      const parsedToken = await verifyToken(sessionCookie.value);
      const status = parsedToken.subscriptionStatus;

      // --- CORREÇÃO PRINCIPAL ---
      // Verificamos se o status NÃO é 'active' E TAMBÉM NÃO é 'trialing'.
      // Isto garante que utilizadores em período de teste tenham acesso.
      if (status !== 'active' && status !== 'trialing') {
        return NextResponse.redirect(new URL(SUBSCRIBE_PATH, request.url));
      }

    } catch (error) {
      console.error('Token de sessão inválido:', error);
      const response = NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  if (isSubscribePage && sessionCookie) {
    try {
      const parsedToken = await verifyToken(sessionCookie.value);
      const status = parsedToken.subscriptionStatus;

      // Adicionamos a verificação de 'trialing' aqui também
      if (status === 'active' || status === 'trialing') {
        return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
      }
    } catch (error) {
      // Se o token for inválido, não faz nada, deixa o utilizador ver a página.
    }
  }

  const res = NextResponse.next();
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const { expires, ...payloadForToken } = parsed;

      res.cookies.set({
        name: 'session',
        value: await signToken(payloadForToken),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Erro ao atualizar a sessão:', error);
      res.cookies.delete('session');
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
