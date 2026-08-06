import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CHECKLIST_ITEMS = [
  { key: 'sourceCode', label: 'Source Code' },
  { key: 'adminCredentials', label: 'Admin Credentials' },
  { key: 'userManual', label: 'User Manual' },
  { key: 'trainingCompleted', label: 'Training Completed' },
  { key: 'clientAcceptance', label: 'Client Acceptance' },
];

export default function ProjectDelivery() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [warranty, setWarranty] = useState('');

  useEffect(() => {
    projectsAPI.getAll().then(({ data }) => setProjects(data.items || data.projects || [])).finally(() => setLoading(false));
  }, []);

  const selectProject = (p) => {
    setSelected(p);
    setChecklist(p.deliveryChecklist || {});
    setWarranty(p.deliveryChecklist?.warrantyPeriod || '');
  };

  const toggle = (key) => setChecklist({ ...checklist, [key]: !checklist[key] });
  const markDelivered = async () => {
    try {
      await projectsAPI.update(selected._id, {
        status: 'completed',
        workflowStage: 'completed',
        deliveryChecklist: { ...checklist, warrantyPeriod: warranty },
        deliveredAt: new Date().toISOString(),
      });
      toast.success('Project marked as delivered');
      setSelected(null);
      projectsAPI.getAll().then(({ data: list }) => setProjects(list.items || list.projects || []));
    } catch {
      toast.error('Failed to update project');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Project Delivery</h1><p className="text-gray-400 mt-1">Delivery checklist and completion reports</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h3 className="text-lg font-semibold text-white mb-3">Projects</h3>
          {projects.map((p) => (
            <button key={p._id} onClick={() => selectProject(p)} className={`w-full text-left p-3 rounded-lg border ${selected?._id === p._id ? 'border-myth-accent bg-myth-accent/10' : 'border-myth-border hover:bg-myth-surface/50'}`}>
              <p className="text-white font-medium">{p.name}</p><p className="text-xs text-gray-500 capitalize">{p.status}</p>
            </button>
          ))}
        </div>
        {selected && (
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Delivery Checklist — {selected.name}</h3>
            <div className="space-y-3 mb-4">
              {CHECKLIST_ITEMS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={!!checklist[key]} onChange={() => toggle(key)} className="rounded" /> {label}
                </label>
              ))}
              <div><label className="block text-sm text-gray-400 mb-1">Warranty Period</label><input className="input-field w-full" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. 12 months" /></div>
            </div>
            <div className="flex gap-3"><button onClick={markDelivered} className="btn-primary">Mark Delivered</button><button className="btn-secondary">Generate Completion Report</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
