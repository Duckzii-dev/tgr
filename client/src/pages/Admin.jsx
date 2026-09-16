import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Activity, Shield, Ban, Search, Trash2, Unlock, MoreVertical, ScrollText, Globe,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StatCard from '../components/StatCard.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import Confirm from '../components/Confirm.jsx';
import { fmtDate, fmtNumber } from '../lib/format.js';

const TABS = ['Users', 'IP Blocks', 'Audit Log'];

export default function Admin() {
  const [tab, setTab] = useState('Users');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-semibold">Admin</h1>
      </div>

      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm whitespace-nowrap ${
              tab === t
                ? 'text-accent border-b-2 border-accent'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Users' && <UsersTab />}
      {tab === 'IP Blocks' && <BlocksTab />}
      {tab === 'Audit Log' && <AuditTab />}
    </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [banned, setBanned] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [blockIpTarget, setBlockIpTarget] = useState(null);

  const stats = useFetch(() => api.get('/admin/stats'), []);
  const users = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (banned) p.set('banned', banned);
      p.set('sort', sort);
      p.set('limit', '100');
      return api.get(`/admin/users?${p}`);
    },
    [q, banned, sort]
  );

  const doBan = async () => {
    try {
      await api.post(`/admin/users/${banTarget.id}/ban`, { reason: banReason });
      toast('User banned');
      setBanTarget(null);
      setBanReason('');
      users.refresh();
      stats.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doUnban = async (id) => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      toast('User unbanned');
      users.refresh();
      stats.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doDelete = async () => {
    try {
      await api.del(`/admin/users/${deleteTarget.id}`);
      toast('User deleted');
      setDeleteTarget(null);
      users.refresh();
      stats.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doSetRole = async (role) => {
    try {
      await api.put(`/admin/users/${roleTarget.id}/role`, { role });
      toast('Role updated');
      setRoleTarget(null);
      users.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doBlockIp = async () => {
    try {
      await api.post(`/admin/users/${blockIpTarget.id}/block-ip`);
      toast('IP blocked');
      setBlockIpTarget(null);
      stats.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const s = stats.data;

  return (
    <div className="space-y-4">
      {stats.loading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={fmtNumber(s?.users.total)} icon={Users} />
          <StatCard label="Active 24h" value={fmtNumber(s?.users.active24h)} icon={Activity} />
          <StatCard label="New (7d)" value={fmtNumber(s?.users.newThisWeek)} />
          <StatCard label="Banned" value={fmtNumber(s?.users.banned)} icon={Ban} />
        </div>
      )}

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search email / name / id"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-40"
          value={banned}
          onChange={(e) => setBanned(e.target.value)}
        >
          <option value="">All</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
        <select
          className="input sm:w-44"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="createdAt">Newest</option>
          <option value="lastLoginAt">Last login</option>
          <option value="email">Email</option>
        </select>
      </div>

      {users.loading ? (
        <Skeleton className="h-64" />
      ) : users.data?.users?.length ? (
        <div className="space-y-2">
          {users.data.users.map((u) => (
            <div
              key={u.id}
              className={`card p-4 flex items-center gap-3 ${
                u.isBanned ? 'border-red-500/40' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center text-sm shrink-0">
                {(u.name || u.email || '?')[0].toUpperCase()}
              </div>
              <Link
                to={`/admin/users/${u.id}`}
                className="flex-1 min-w-0 hover:text-accent"
              >
                <div className="font-medium truncate flex items-center gap-2">
                  {u.name || '—'}
                  {u.role === 'admin' && (
                    <span className="chip border-accent text-accent text-[10px]">ADMIN</span>
                  )}
                  {u.isBanned && (
                    <span className="chip border-red-500 text-red-400 text-[10px]">BANNED</span>
                  )}
                </div>
                <div className="text-xs text-ink-400 truncate">
                  {u.email} · {u._count.workouts} workouts · last{' '}
                  {u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'never'}
                </div>
              </Link>

              <div className="flex items-center gap-1 shrink-0">
                {u.isBanned ? (
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => doUnban(u.id)}
                    title="Unban"
                  >
                    <Unlock className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => setBanTarget(u)}
                    title="Ban"
                  >
                    <Ban className="w-3 h-3" />
                  </button>
                )}
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => setRoleTarget(u)}
                  title="Change role"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => setBlockIpTarget(u)}
                  title="Block last IP"
                  disabled={!u.lastLoginIp}
                >
                  <Globe className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-ghost text-xs text-red-400"
                  onClick={() => setDeleteTarget(u)}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No users" />
      )}

      <Modal open={!!banTarget} onClose={() => setBanTarget(null)} title="Ban user">
        <div className="space-y-3">
          <div className="text-sm text-ink-300">
            Ban <strong>{banTarget?.email}</strong>? User sẽ bị logout và không
            thể đăng nhập.
          </div>
          <div>
            <label className="label">Reason (optional)</label>
            <input
              className="input"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setBanTarget(null)}>
              Cancel
            </button>
            <button
              className="btn bg-red-500 text-white hover:bg-red-600"
              onClick={doBan}
            >
              Ban
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Change role">
        <div className="space-y-3">
          <div className="text-sm text-ink-300">
            User: <strong>{roleTarget?.email}</strong> · Current role:{' '}
            <strong>{roleTarget?.role}</strong>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost flex-1 justify-center"
              onClick={() => doSetRole('user')}
            >
              Set as User
            </button>
            <button
              className="btn btn-primary flex-1 justify-center"
              onClick={() => doSetRole('admin')}
            >
              Set as Admin
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!blockIpTarget}
        onClose={() => setBlockIpTarget(null)}
        title="Block user's last IP"
      >
        <div className="space-y-3">
          <div className="text-sm text-ink-300">
            Block IP <strong>{blockIpTarget?.lastLoginIp}</strong> (last login of{' '}
            {blockIpTarget?.email})? Mọi request từ IP này sẽ bị từ chối.
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setBlockIpTarget(null)}>
              Cancel
            </button>
            <button
              className="btn bg-red-500 text-white hover:bg-red-600"
              onClick={doBlockIp}
            >
              Block IP
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title={`Delete ${deleteTarget?.email}?`}
        body="Toàn bộ workout, bodyweight, goal, PR của user này sẽ bị xoá vĩnh viễn."
        confirmLabel="Delete"
      />
    </div>
  );
}

function BlocksTab() {
  const toast = useToast();
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [delTarget, setDelTarget] = useState(null);

  const blocks = useFetch(() => api.get('/admin/blocks'), []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/blocks', {
        ip: ip.trim(),
        reason: reason || null,
        expiresAt: expiresAt || null,
      });
      toast('IP blocked');
      setIp('');
      setReason('');
      setExpiresAt('');
      blocks.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const doDelete = async () => {
    try {
      await api.del(`/admin/blocks/${delTarget.id}`);
      toast('IP unblocked');
      setDelTarget(null);
      blocks.refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">IP address</label>
          <input
            className="input"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="1.2.3.4"
            required
          />
        </div>
        <div>
          <label className="label">Reason</label>
          <input
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="spam"
          />
        </div>
        <div>
          <label className="label">Expires (optional)</label>
          <input
            className="input"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <button className="btn btn-primary self-end justify-center">
          Block IP
        </button>
      </form>

      {blocks.loading ? (
        <Skeleton className="h-40" />
      ) : blocks.data?.blocks?.length ? (
        <div className="space-y-1">
          {blocks.data.blocks.map((b) => (
            <div
              key={b.id}
              className="card p-3 flex items-center justify-between text-sm"
            >
              <div>
                <div className="font-mono">{b.ip}</div>
                <div className="text-xs text-ink-400">
                  {b.reason || '—'} · by {b.createdBy || 'system'} ·{' '}
                  {fmtDate(b.createdAt)}
                  {b.expiresAt ? ` · expires ${fmtDate(b.expiresAt)}` : ''}
                </div>
              </div>
              <button
                className="text-ink-400 hover:text-red-400"
                onClick={() => setDelTarget(b)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No IPs blocked" />
      )}

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={doDelete}
        title={`Unblock ${delTarget?.ip}?`}
      />
    </div>
  );
}

function AuditTab() {
  const audit = useFetch(() => api.get('/admin/audit?limit=200'), []);

  if (audit.loading) return <Skeleton className="h-64" />;
  if (!audit.data?.logs?.length) return <Empty title="No audit logs" icon={ScrollText} />;

  return (
    <div className="space-y-1">
      {audit.data.logs.map((l) => (
        <div key={l.id} className="card p-3 text-sm flex items-start gap-3">
          <ScrollText className="w-4 h-4 text-ink-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{l.action}</span>
              {l.targetType && (
                <span className="chip text-[10px]">
                  {l.targetType}:{l.targetId?.slice(0, 8)}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-400">
              {l.actorEmail || 'system'} · {fmtDate(l.createdAt)} ·{' '}
              {l.ip || '—'}
            </div>
            {l.meta && (
              <pre className="text-xs text-ink-500 mt-1 whitespace-pre-wrap break-all">
                {JSON.stringify(l.meta)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}