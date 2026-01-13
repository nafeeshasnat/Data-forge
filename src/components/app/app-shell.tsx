'use client';

import type { ReactNode } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/app/logo';
import { AppNav } from '@/components/app/app-nav';

interface AppShellProps {
  title: string;
  icon: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  pathname: string;
}

export function AppShell({ title, icon, sidebar, children, pathname }: AppShellProps) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 md:w-96 md:border-r">
        <SidebarHeader className="border-b p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-4">
          {sidebar}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              {icon}
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
          <AppNav pathname={pathname} />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
