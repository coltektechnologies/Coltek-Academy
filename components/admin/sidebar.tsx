import { BookOpen, Home, LogOut, Settings, Upload, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Certificates', href: '/admin/certificates', icon: Upload },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Image 
            src="/Coltek Academy.png" 
            alt="Coltek Academy" 
            width={120}
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
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
