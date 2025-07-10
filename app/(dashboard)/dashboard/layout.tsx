'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Calendar, BarChart2, ChevronsLeft, ChevronsRight } from 'lucide-react';

const NavLink = ({ item, pathname, isCollapsed }: { item: any; pathname: string; isCollapsed: boolean }) => (
  <Link href={item.href} passHref>
    <Button
      variant={pathname === item.href ? 'secondary' : 'ghost'}
      // Adicionado 'overflow-hidden' para cortar o texto que vaza durante a animação.
      className={`w-full gap-3 transition-colors overflow-hidden ${
        pathname === item.href 
          ? 'bg-gray-700 text-white hover:bg-gray-600' 
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className={`whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>
        {item.label}
      </span>
    </Button>
  </Link>
);

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true); 

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/calendario', icon: Calendar, label: 'Calendário' },
    { href: '/dashboard/trades', icon: BarChart2, label: 'Trades' },
  ];

  return (
    // --- MUDANÇA AQUI ---
    // Este contentor 'flex-1' ocupa o espaço vertical restante.
    // 'overflow-hidden' cria um contexto de formatação que impede os filhos de transbordar,
    // permitindo que o 'overflow-y-auto' no <main> funcione corretamente.
    <div className="flex flex-1 overflow-hidden">
      <aside
        // A sidebar agora estica-se naturalmente à altura do seu contentor pai.
        className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-700 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full h-full text-gray-400 hover:bg-gray-700 hover:text-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <nav className="flex flex-col p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </aside>

      {/* O conteúdo principal agora tem a sua própria barra de rolagem interna. */}
      <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
