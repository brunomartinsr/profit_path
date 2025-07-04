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
      className={`w-full gap-3 transition-colors ${
        pathname === item.href 
          ? 'bg-gray-700 text-white hover:bg-gray-600' 
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
    </Button>
  </Link>
);

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Começa a sidebar recolhida por defeito para uma aparência mais limpa
  const [isCollapsed, setIsCollapsed] = useState(true); 

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/calendario', icon: Calendar, label: 'Calendário' },
    { href: '/dashboard/trades', icon: BarChart2, label: 'Trades' },
  ];

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar Retrátil */}
      <aside
        className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Botão de Recolher/Expandir no topo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
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

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {children}
      </main>
    </div>
  );
}
