import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
