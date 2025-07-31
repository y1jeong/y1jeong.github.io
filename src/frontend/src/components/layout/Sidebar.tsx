import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  PenTool,
  Image,
  User,
  Settings,
  FileText,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Dashboard and overview'
  },
  {
    title: 'Design',
    href: '/design',
    icon: PenTool,
    description: 'Create and edit designs'
  },
  {
    title: 'Gallery',
    href: '/gallery',
    icon: Image,
    description: 'Browse your designs'
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Manage your account'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App preferences'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform border-r bg-background transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div>{item.title}</div>
                    {item.description && (
                      <div className="text-xs opacity-70">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Quick actions */}
          <div className="border-t p-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </h3>
              <Link
                to="/design/new"
                onClick={onClose}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <PenTool className="h-4 w-4" />
                <span>New Design</span>
              </Link>
              <Link
                to="/export"
                onClick={onClose}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Link>
              <Link
                to="/docs"
                onClick={onClose}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="h-4 w-4" />
                <span>Documentation</span>
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};