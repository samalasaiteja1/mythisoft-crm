import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { usePermissions } from '../hooks/usePermissions';
import { canConvertLeadToDeal, hasLeadDeal, getLeadDealId } from '../constants/leadPipeline';
import { ADMIN_LEAD_NAV } from '../constants/adminLeadViews';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminInfoBanner,
  AdminContentCard,
  AdminEmptyState,
} from '../components/admin/adminUi';

const emptyQual = { budgetConfirmed: false, decisionMaker: '', timeline: '', requirements: '', competitors: '', probability: 50, score: 50 };

export default function QualifiedLeads() {
  const navigate = useNavigate();
  const { canWrite, isAdmin, isManager } = usePermissions();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyQual);

  const fetch = () => {
    setLoading(true);
    leadsAPI.getAll({ status: 'qualified', limit: 100 })
      .then(({ data }) => setLeads(data.leads || []))
      .catch(() => leadsAPI.getAll({ limit: 100 }).then(({ data }) => setLeads((data.leads || []).filter((l) => l.isQualified || l.status === 'qualified'))))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openQualify = (lead) => { setSelected(lead); setForm({ ...emptyQual, ...lead.qualification }); };
  const handleQualify = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.qualify(selected._id, form);
      toast.success('Lead qualified');
      setSelected(null);
      fetch();
    } catch { toast.error('Failed to qualify lead'); }
  };
  const handleConvertDeal = (id) => navigate(`/deals/create?leadId=${id}`);
  if (loading) return <LoadingSpinner />;

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={Star}
        title={isAdmin ? ADMIN_LEAD_NAV.qualified.title : 'Qualified Leads'}
        subtitle={isAdmin ? ADMIN_LEAD_NAV.qualified.subtitle : 'Interested leads ready to qualify and convert to a deal'}
        meta={`${leads.length} qualified lead${leads.length !== 1 ? 's' : ''}`}
      />

      {isAdmin && (
        <AdminInfoBanner>
          Review <span className="text-white">Sales Manager</span> and <span className="text-white">Sales Executive</span> on each lead before converting to a deal.
          <Link to="/reports/leads" className="text-myth-accent hover:underline ml-2">View analytics →</Link>
        </AdminInfoBanner>
      )}

      <AdminContentCard title={`Qualified leads (${leads.length})`}>
        {leads.length === 0 ? (
          <AdminEmptyState message="No qualified leads yet — move interested leads to Qualified stage first." icon={Star} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Lead</th>
                  <th className="table-header">Company</th>
                  <th className="table-header">Budget</th>
                  {(isAdmin || isManager) && <th className="table-header">Manager</th>}
                  {(isAdmin || isManager) && <th className="table-header">Sales Executive</th>}
                  <th className="table-header">Score</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l._id} className="border-t border-myth-border hover:bg-myth-surface/30 transition-colors">
                    <td className="table-cell">
                      <Link to={`/leads/${l._id}`} className="text-white hover:text-myth-accent font-medium">{l.firstName} {l.lastName}</Link>
                    </td>
                    <td className="table-cell text-gray-400">{l.company || '—'}</td>
                    <td className="table-cell text-emerald-300">{formatCurrency(l.budget || l.value)}</td>
                    {(isAdmin || isManager) && (
                      <td className="table-cell text-gray-400">
                        {l.assignedManager
                          ? `${l.assignedManager.firstName || ''} ${l.assignedManager.lastName || ''}`.trim() || '—'
                          : '—'}
                      </td>
                    )}
                    {(isAdmin || isManager) && (
                      <td className="table-cell text-gray-400">
                        {l.assignedTo ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim() : 'Unassigned'}
                      </td>
                    )}
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-myth-accent/15 text-cyan-300">{l.qualification?.score || l.score || 0}%</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {getLeadDealId(l) ? (
                          <Link to={`/deals/${getLeadDealId(l)}`} className="btn-secondary text-xs py-1 px-2">View Deal</Link>
                        ) : hasLeadDeal(l) ? (
                          <span className="text-xs text-green-400 py-1 px-2">Deal created</span>
                        ) : canWrite('deals') && canConvertLeadToDeal(l) && (
                          <button onClick={() => handleConvertDeal(l._id)} className="btn-primary text-xs py-1 px-2">Convert to Deal</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminContentCard>

      {selected && (
        <Modal isOpen onClose={() => setSelected(null)} title={`Qualify ${selected.firstName} ${selected.lastName}`}>
          <form onSubmit={handleQualify} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm text-gray-400 mb-1">Timeline</label><input className="input-field w-full" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Decision maker</label><input className="input-field w-full" value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} /></div>
            </div>
            <div><label className="block text-sm text-gray-400 mb-1">Requirements</label><textarea className="input-field w-full" rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Save qualification</button>
              <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </AdminPageShell>
  );
}
