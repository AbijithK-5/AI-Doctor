import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { AppLayout } from '../../components/AppLayout';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const { refreshUnreadCount } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = async () => {
    const res = await apiRequest('/api/notifications');
    setItems(res.notifications || []);
    await refreshUnreadCount();
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: number) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    await load();
  };

  const markAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    showToast('All notifications marked as read.', 'success');
    await load();
  };

  const visible = filter === 'unread' ? items.filter((i) => !i.is_read) : items;

  return (
    <AppLayout title="Notifications" subtitle="Appointment reminders, AI completion alerts, doctor responses, and comparison availability">
      <div className="space-y-4 max-w-4xl">
        <div className="healthcare-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${filter === 'all' ? 'bg-[#0B2D52] text-white' : 'bg-slate-100 text-slate-700'}`}>
              All ({items.length})
            </button>
            <button onClick={() => setFilter('unread')} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${filter === 'unread' ? 'bg-[#0B2D52] text-white' : 'bg-slate-100 text-slate-700'}`}>
              Unread ({items.filter((i) => !i.is_read).length})
            </button>
          </div>
          <button onClick={markAllRead} className="px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-teal-100">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        </div>

        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="healthcare-card p-10 text-center text-slate-500">No notifications to display.</div>
          ) : (
            visible.map((n) => (
              <div
                key={n.id}
                className={`healthcare-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.is_read ? 'border-l-4 border-l-teal-600 bg-sky-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0B2D52]">{n.title}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <div className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.link_url && (
                    <Link to={n.link_url} className="px-3 py-1.5 rounded-lg bg-[#0B2D52] text-white text-xs font-semibold">
                      Open
                    </Link>
                  )}
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};
