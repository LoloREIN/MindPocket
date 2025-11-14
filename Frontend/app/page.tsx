'use client';

import { useState } from 'react';
import { MobileHeader } from '@/components/mobile-header';
import { ItemsList } from '@/components/items-list';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <MobileHeader title="MindPocket" onItemAdded={handleSuccess} />
      
      <div className="p-4 space-y-6">
        <ItemsList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
