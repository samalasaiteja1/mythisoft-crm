import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { DeploymentRequestForm } from '../components/techManager/TechManagerForms';
import { usePermissions } from '../hooks/usePermissions';
import { TechManagerPageHeader } from '../components/techManager/techManagerUi';

export default function Deployment() {
  const { canAction } = usePermissions();
  const canMarkDeployed = canAction('tickets', 'update') || canAction('deployment', 'update');
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [markingId, setMarkingId] = useState(null);

  const fetch = () => {
    setLoading(true);
    ticketsAPI.getAll()
      .then(({ data }) => {
        const items = (data.items || []).filter((t) => t.category === 'deployment' || String(t.subject || '').startsWith('Deployment:'));
        setDeployments(items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const markDeployed = async (id) => {
    setMarkingId(id);
    try {
      await ticketsAPI.update(id, { technicalStatus: 'resolved', status: 'resolved' });
      toast.success('Deployment marked complete — moved to History');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update deployment status');
    } finally {
      setMarkingId(null);
    }
  };

  const pending = deployments.filter((d) => !['resolved', 'closed'].includes(d.technicalStatus));
  const history = deployments.filter((d) => ['resolved', 'closed'].includes(d.technicalStatus));
  const list = filter === 'pending' ? pending : history;

  const projectLabel = (deployment) => {
    if (!deployment.project) return null;
    if (typeof deployment.project === 'object' && deployment.project.name) {
      return deployment.project.name;
    }
    return null;
  };

  const projectId = (deployment) => {
    if (!deployment.project) return null;
    return deployment.project._id || deployment.project;
  };

  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={Rocket}
        title="Deployment"
        subtitle="Request deployments and track staging and production releases. After you deploy on the server, use Mark deployed to move the request from Pending to History."
      />

      <DeploymentRequestForm onCreated={fetch} />

      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'pending' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}>
          Pending ({pending.length})
        </button>
        <button type="button" onClick={() => setFilter('history')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'history' ? 'bg-myth-accent/20 text-myth-accent' : 'bg-myth-surface text-gray-400'}`}>
          History ({history.length})
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="card text-center text-gray-500 py-12">No deployment requests</div>
          ) : list.map((d) => {
            const done = ['resolved', 'closed'].includes(d.technicalStatus);
            const name = projectLabel(d);
            const pid = projectId(d);
            return (
              <div key={d._id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">{d.subject}</p>
                  {name && (
                    <p className="text-sm text-myth-accent mt-1">
                      Project:{' '}
                      {pid ? (
                        <Link to={`/projects/${pid}`} className="hover:underline">{name}</Link>
                      ) : (
                        name
                      )}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">{d.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <span className={`badge flex items-center gap-1 w-fit ${done ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {done ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {done ? 'Deployed' : 'Pending'}
                  </span>
                  {!done && canMarkDeployed && (
                    <button
                      type="button"
                      onClick={() => markDeployed(d._id)}
                      disabled={markingId === d._id}
                      className="btn-primary text-xs inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      {markingId === d._id ? 'Saving…' : 'Mark deployed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
