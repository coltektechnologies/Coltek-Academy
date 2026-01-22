import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { UserMenu } from './user-menu';

type AdminHeaderProps = {
  title: string;
  description?: string;
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                className="pl-10 w-64"
                placeholder="Search..."
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
