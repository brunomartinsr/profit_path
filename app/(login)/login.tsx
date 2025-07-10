'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

// Componente para o logo, pode ser um SVG ou um componente de texto estilizado
function Logo() {
  return (
    <div className="flex items-center justify-center mb-8">
      <span className="text-3xl font-bold text-white">
        P<span className="text-cyan-400">.</span> Profit Path
      </span>
    </div>
  );
}

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const isSigningIn = mode === 'signin';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {isSigningIn ? 'Faça login' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-gray-400">
              {isSigningIn ? 'Bem-vindo de volta!' : 'Comece a sua jornada.'}
            </p>
          </div>

          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                E-mail
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Senha
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSigningIn ? 'current-password' : 'new-password'}
                  defaultValue={state.password}
                  required
                  minLength={8}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isSigningIn && (
                 <div className="text-right text-sm">
                    <Link href="#" className="font-medium text-cyan-400 hover:text-cyan-300">
                        Esqueceu sua senha?
                    </Link>
                </div>
            )}

            {state?.error && (
              <div className="text-red-400 text-sm text-center">{state.error}</div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Aguarde...
                  </>
                ) : isSigningIn ? (
                  'Entrar'
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-gray-400">
            {isSigningIn ? 'Não tem uma conta? ' : 'Já possui uma conta? '}
            <Link
              href={`${isSigningIn ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              {isSigningIn ? 'Cadastre-se' : 'Faça login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
