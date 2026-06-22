import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Users' };
export default function Page() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage Users records and data</p>
        </div>
      </div>
      <div className="card p-12 text-center">
        <div className="text-slate-400 dark:text-slate-600">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Users Module</h2>
          <p className="text-sm">This module is fully implemented in the backend. Frontend UI is being built in Phase 2+.</p>
        </div>
      </div>
    </div>
  );
}
