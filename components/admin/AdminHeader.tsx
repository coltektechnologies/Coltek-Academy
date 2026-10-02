import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { UserMenu } from './user-menu';
import { ChangeEvent, KeyboardEvent, useState, useEffect } from 'react';

interface AdminHeaderProps {
  title: string;
  description?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminHeader({ 
  title, 
  description, 
  searchQuery = '', 
  onSearchChange,
  onSearchSubmit,
  placeholder = 'Search...',
  className = ''
}: AdminHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleSearchSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(localSearchQuery);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange?.('');
    onSearchSubmit?.('');
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="flex flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* Search is shown only when the page actually filters something with it */}
            {onSearchChange && (
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <Input
                type="search"
                className={`pl-10 pr-8 w-full ${className}`}
                placeholder={placeholder}
                value={localSearchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            )}
            {/* No notification system exists, so there is no notifications button */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
