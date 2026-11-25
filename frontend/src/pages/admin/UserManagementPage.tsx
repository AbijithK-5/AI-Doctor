import React, { useEffect, useState } from 'react';
import { Plus, Search, ShieldOff, Trash2, UserCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', phone_number: '', password: '', role: 'patient' });

  const load = async () => {
    const params = new URLSearchParams({ role: roleFilter, q: searchQ });
    const res = await apiRequest(`/api/admin/users?${params.toString()}`);
    setUsers(res);
  };

  useEffect(() => {
    load();
  }, [roleFilter, searchQ]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
      showToast('User created successfully.', 'success');
      setShowAdd(false);
      setNewUser({ full_name: '', email: '', phone_number: '', password: '', role: 'patient' });
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const updateUser = async (id: number, patch: any) => {
    try {
      await apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      showToast('User updated.', 'success');
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' });
      showToast('User removed under retention policy.', 'info');
      await load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppLayout title="User Management" subtitle="Create, edit, suspend, activate, and manage role-based permissions">
      <div className="space-y-6">
        <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="all">All Roles</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="researcher">Researcher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="healthcare-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F8FC] border-b border-slate-200 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="p-4 font-semibold text-[#0B2D52]">{u.full_name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold capitalize bg-white"
                    >
                      <option value="patient">patient</option>
                      <option value="doctor">doctor</option>
                      <option value="researcher">researcher</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {u.status === 'active' ? (
                      <button onClick={() => updateUser(u.id, { status: 'suspended' })} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold inline-flex items-center gap-1">
                        <ShieldOff className="w-3.5 h-3.5" /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => updateUser(u.id, { status: 'active' })} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    <button onClick={() => deleteUser(u.id)} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#0B2D52]">Add Platform User</h3>
            <input type="text" required placeholder="Full Name" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input type="email" required placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input type="text" placeholder="Phone Number" value={newUser.phone_number} onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input type="password" required minLength={6} placeholder="Temporary Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="researcher">Researcher</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#0B2D52] text-white text-sm font-semibold">Create User</button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};
