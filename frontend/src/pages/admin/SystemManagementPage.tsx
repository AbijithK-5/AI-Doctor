import React, { useEffect, useState } from 'react';
import { Cpu, Database, HardDrive, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';

export const SystemManagementPage: React.FC = () => {
  const [sys, setSys] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/admin/system').then(setSys);
  }, []);

  return (
    <AppLayout title="System Management" subtitle="AI model configuration, database health, secure document storage, backups, and security audit logs">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="healthcare-card p-5 space-y-2">
            <Database className="w-6 h-6 text-teal-600" />
            <div className="text-xs font-bold uppercase text-slate-500">Database Engine</div>
            <div className="text-sm font-bold text-[#0B2D52]">{sys?.database_engine || 'Loading...'}</div>
          </div>
          <div className="healthcare-card p-5 space-y-2">
            <Cpu className="w-6 h-6 text-sky-600" />
            <div className="text-xs font-bold uppercase text-slate-500">AI Model Config</div>
            <div className="text-sm font-bold text-[#0B2D52]">{sys?.ai_configuration?.model_name}</div>
            <div className="text-xs text-slate-500">
              Mode: {sys?.ai_configuration?.demo_mode_active ? 'Demo Scikit-learn NLP' : 'External LLM'}
            </div>
          </div>
          <div className="healthcare-card p-5 space-y-2">
            <HardDrive className="w-6 h-6 text-indigo-600" />
            <div className="text-xs font-bold uppercase text-slate-500">File Storage</div>
            <div className="text-sm font-bold text-[#0B2D52]">{sys?.storage?.stored_files_count ?? 0} Stored Files</div>
            <div className="text-xs text-slate-500">{sys?.storage?.total_storage_kb ?? 0} KB used</div>
          </div>
          <div className="healthcare-card p-5 space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <div className="text-xs font-bold uppercase text-slate-500">Backup Status</div>
            <div className="text-sm font-bold text-emerald-700">{sys?.backup_status?.status || 'Healthy'}</div>
            <div className="text-xs text-slate-500">Retention: {sys?.backup_status?.retention_days ?? 365} days</div>
          </div>
        </div>

        <div className="healthcare-card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0B2D52]">System &amp; Security Audit Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F4F8FC] border-b border-slate-200 uppercase text-slate-500">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sys?.audit_logs || []).map((l: any) => (
                  <tr key={l.id}>
                    <td className="p-3 text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-3 font-semibold uppercase text-teal-700">{l.actor_role || 'system'}</td>
                    <td className="p-3 font-bold text-[#0B2D52]">{l.action}</td>
                    <td className="p-3 text-slate-600">{l.resource_type} #{l.resource_id}</td>
                    <td className="p-3 text-slate-500">{l.ip_address || 'local'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
