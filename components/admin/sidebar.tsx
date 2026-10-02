import { BookOpen, Home, LogOut, Settings, FileText, Users, GraduationCap, MessageSquareQuote, FolderKanban } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Certificates', href: '/admin/certificates', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Enrollments', href: '/admin/enrollments', icon: GraduationCap },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
    { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-primary text-primary-foreground">
        <div aria-hidden="true" className="h-1 bg-brand-gradient" />
        <div className="flex items-center h-16 px-4 border-b border-primary-foreground/15">
          <Image 
            src="/coltek-academy-logo-white.svg" 
            alt="Coltek Academy" 
            width={117}
            height={40}
            className="h-10 w-auto" 
          />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href) 
                  ? 'bg-primary-foreground/10 text-primary-foreground' 
                  : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
              }`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-brand-teal' : ''}`} aria-hidden="true" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-foreground/15">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
