import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, FileText, ClipboardList, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, formatDateTime } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SUPPORT_REVIEW_STATUSES } from '../../constants/supportWorkflow';
import { projectVersion } from '../../constants/supportExecutive';
import { SUPPORT_PERSON_PROJECT_TABS } from '../../constants/supportPersonNav';
import { useAuth } from '../../context/AuthContext';

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—');

function tabMatchesProject(tabKey, supportReviewStatus) {
  const tab = SUPPORT_PERSON_PROJECT_TABS.find((t) => t.key === tabKey) || SUPPORT_PERSON_PROJECT_TABS[0];
  if (!tab.statuses) return true;
  return tab.statuses.includes(supportReviewStatus);
}

export default function SupportPersonMyProjects() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'all');

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'all';
    if (SUPPORT_PERSON_PROJECT_TABS.some((t) => t.key === urlTab)) setTab(urlTab);
  }, [searchParams]);

  useEffect(() => {
    projectsAPI.getAll({ limit: 100 })
      .then(({ data }) => setProjects(data.items || data.projects || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const myId = String(user?._id || '');

  const assigned = useMemo(() => projects.filter((p) => {
    const primary = String(p.supportExecutiveAssignee?._id || p.supportExecutiveAssignee || '');
    const team = (p.supportTeamAssignees || []).map((u) => String(u._id || u));
    return primary === myId || team.includes(myId);
  }), [projects, myId]);

  const counts = useMemo(() => {
    const map = {};
    SUPPORT_PERSON_PROJECT_TABS.forEach((t) => {
      map[t.key] = assigned.filter((p) => tabMatchesProject(t.key, p.supportReviewStatus)).length;
    });
    return map;
  }, [assigned]);

  const filtered = useMemo(
    () => assigned.filter((p) => tabMatchesProject(tab, p.supportReviewStatus)),
    [assigned, tab],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FolderKanban size={24} className="text-indigo-400" /> My Projects
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Projects assigned by your Support Manager.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUPPORT_PERSON_PROJECT_TABS.map((t) => (
          <Link
            key={t.key}
            to={t.key === 'all' ? '/support/my-projects' : `/support/my-projects?tab=${t.key}`}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              tab === t.key
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200'
                : 'border-myth-border text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          {assigned.length === 0 ? 'No projects assigned yet.' : 'No projects in this view.'}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-myth-border">
                <th className="pb-3 pr-4">Project Name</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Version</th>
                <th className="pb-3 pr-4">Support Status</th>
                <th className="pb-3 pr-4">Assigned Date</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const statusMeta = SUPPORT_REVIEW_STATUSES[p.supportReviewStatus] || {};
                return (
                  <tr key={p._id} className="border-b border-myth-border/50 hover:bg-myth-surface/30">
                    <td className="py-3 pr-4">
                      <Link to={`/projects/${p._id}`} className="text-white font-medium hover:text-myth-accent">{p.name}</Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-300">{personName(p.customer)}</td>
                    <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{projectVersion(p)}</td>
                    <td className="py-3 pr-4">
                      {statusMeta.label ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusMeta.color}`}>{statusMeta.label}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {p.supportReviewedAt ? formatDateTime(p.supportReviewedAt) : p.supportHandoffAt ? formatDateTime(p.supportHandoffAt) : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/projects/${p._id}`} className="text-xs text-myth-accent hover:underline inline-flex items-center gap-1">
                          <Eye size={12} /> View Project
                        </Link>
                        <Link to="/support/documents" className="text-xs text-gray-400 hover:text-myth-accent inline-flex items-center gap-1">
                          <FileText size={12} /> Documents
                        </Link>
                        <Link to="/support/my-tasks" className="text-xs text-gray-400 hover:text-myth-accent inline-flex items-center gap-1">
                          <ClipboardList size={12} /> Tasks
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
