'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-300 hover:text-white"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-500">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        {/* --- MUDANÇA AQUI --- */}
        <Avatar className="cursor-pointer size-10">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback className="bg-gray-700 text-gray-300 font-semibold">
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 bg-gray-900 border-gray-700 text-gray-200">
        <DropdownMenuItem className="cursor-pointer focus:bg-blue-900/50 focus:text-white">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full text-left">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="bg-gray-800  border-b border-gray-700">
      <div className="w-full h-20 mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="ml-2 text-4xl font-semibold text-blue-400">Profit Path</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      {children}
    </section>
  );
}
