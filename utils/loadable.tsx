'use client';

import { FC, ComponentType, Suspense, lazy as reactLazy } from 'react';
import { Loader2 } from 'lucide-react';

type ComponentModule<T = {}> = { default: ComponentType<T> };

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function lazy<T = {}>(
  importFn: () => Promise<ComponentModule<T>>,
  fallback: React.ReactNode = <LoadingFallback />
) {
  const LazyComponent = reactLazy(importFn);

  const WrappedComponent: FC<T> = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );

  return WrappedComponent;
}
