import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  className
}) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showSidebar && isAuthenticated}
      />
      
      <div className="flex flex-1">
        {showSidebar && isAuthenticated && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        
        <main className={cn(
          'flex-1 overflow-auto',
          showSidebar && isAuthenticated && 'lg:ml-64'
        )}>
          <div className="container mx-auto px-4 py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};