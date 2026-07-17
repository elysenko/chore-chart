import React, { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import Dashboard from '@/components/pages/Dashboard';

export default function Home() {
  return (
    <AppShell>
      <div data-testid="home-main">
        <Suspense fallback={<div className="skeleton" style={{ height: 240 }} />}>
          <Dashboard />
        </Suspense>
      </div>
    </AppShell>
  );
}
