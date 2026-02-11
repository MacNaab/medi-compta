import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { CloudSyncIndicator } from './CloudSyncIndicator';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Mobile header with trigger */}
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="font-semibold">Remplaçant Pro</span>
          </div>
          <CloudSyncIndicator />
        </header>
        
        {/* Desktop header with cloud indicator */}
        <header className="hidden md:flex h-10 items-center justify-end px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CloudSyncIndicator />
        </header>
        
        <main className="flex-1 overflow-y-auto pb-6">
          <div className="container py-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
