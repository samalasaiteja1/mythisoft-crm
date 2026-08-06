import { useEffect, useMemo, useState } from 'react';
import { Headphones, Send, FileText, Crown, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI } from '../../services/api';
import RequirementsDocLinks from '../projects/RequirementsDocLinks';

function personLabel(member) {
  return `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
}

export default function SupportHandoffPanel({ project, onHandoff, variant = 'default' }) {
  const isAdminView = variant === 'admin';
  const isTechManagerView = variant === 'techManager';

  const [supportTeam, setSupportTeam] = useState([]);
  const [deliveryDocs, setDeliveryDocs] = useState([]);
  const [supportAssignee, setSupportAssignee] = useState(project?.supportAssignee?._id || project?.supportAssignee || '');
  const [supportManager, setSupportManager] = useState('');
  const [supportExecutive, setSupportExecutive] = useState('');
  const [extraAssignees, setExtraAssignees] = useState([]);
  const [notes, setNotes] = useState(project?.supportHandoffNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tmChecklist, setTmChecklist] = useState({
    developmentCompleted: false,
    testingCompleted: false,
    documentationUploaded: false,
  });

  const supportManagers = useMemo(
    () => supportTeam.filter((m) => m.role === 'manager'),
    [supportTeam],
  );
  const supportEmployees = useMemo(
    () => supportTeam.filter((m) => m.role === 'support'),
    [supportTeam],
  );

  useEffect(() => {
    Promise.all([
      projectsAPI.getSupportTeam(),
      projectsAPI.getDeliveryDocuments(project._id),
    ])
      .then(([teamRes, docsRes]) => {
        const members = teamRes.data?.members || [];
        setSupportTeam(members);
        setDeliveryDocs(Array.isArray(docsRes.data) ? docsRes.data : []);

        const mgr = members.find((m) => m.role === 'manager');
        const exec = members.find((m) => m.role === 'support');

        if (isAdminView) {
          const existingMgr = project?.supportAssignee;
          const mgrId = existingMgr && (existingMgr.role === 'manager' || typeof existingMgr === 'object' && existingMgr.role === 'manager')
            ? (existingMgr._id || existingMgr)
            : (typeof existingMgr === 'string' ? existingMgr : '');
          setSupportManager(String(mgrId || mgr?._id || ''));
          const execId = project?.supportExecutiveAssignee?._id || project?.supportExecutiveAssignee || '';
          setSupportExecutive(String(execId || exec?._id || ''));
          const teamIds = (project?.supportTeamAssignees || [])
            .map((u) => String(u._id || u))
            .filter((id) => id && id !== String(execId));
          setExtraAssignees(teamIds);
        } else if (isTechManagerView && !project?.supportAssignee && !project?.supportHandoffAt && mgr) {
          setSupportAssignee(mgr._id);
        }
      })
      .catch(() => toast.error('Failed to load support handoff data'))
      .finally(() => setLoading(false));
  }, [project._id, project?.supportAssignee, project?.supportHandoffAt, project?.supportExecutiveAssignee, project?.supportTeamAssignees, isAdminView, isTechManagerView]);

  const toggleExtraAssignee = (id) => {
    setExtraAssignees((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const handleHandoff = async () => {
    if (isAdminView) {
      if (!supportManager) {
        toast.error('Select a Support Manager');
        return;
      }
      if (!supportExecutive) {
        toast.error('Select a primary support employee (customer contact)');
        return;
      }
    } else if (!supportAssignee) {
      toast.error(isTechManagerView ? 'Select a support manager or agent' : 'Select a support team member');
      return;
    }

    if (isTechManagerView) {
      const { developmentCompleted, testingCompleted, documentationUploaded } = tmChecklist;
      if (!developmentCompleted || !testingCompleted || !documentationUploaded) {
        toast.error('Confirm development, testing, and documentation before submitting');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = isAdminView
        ? {
          supportManager,
          supportExecutive,
          supportTeamAssignees: extraAssignees,
          notes: notes.trim(),
        }
        : {
          supportAssignee,
          notes: notes.trim(),
          ...(isTechManagerView ? { tmHandoffChecklist: tmChecklist } : {}),
        };

      const { data } = await projectsAPI.handoffToSupport(project._id, payload);
      toast.success(
        isAdminView
          ? 'Project delivered to support — manager and team assigned'
          : isTechManagerView
            ? 'Project submitted to support — documents shared and follow-up scheduled'
            : 'Project handed off to support — documents shared and follow-up scheduled',
      );
      onHandoff?.(data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to hand off to support');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading support handoff…</p>;

  const alreadyHandedOff = Boolean(project.supportHandoffAt || project.supportAssignee);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Headphones size={18} className="text-orange-400" />
          {isAdminView
            ? 'Deliver to Support Team'
            : isTechManagerView
              ? 'Submit to Support Manager'
              : 'Hand off to Support Team'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {isAdminView
            ? 'Assign the Support Manager and support employee(s). The primary employee becomes the customer contact.'
            : isTechManagerView
              ? 'Assign the Support Manager to take ownership — or pick a support agent. Delivery documents are shared automatically.'
              : 'Assign a support person, share completion documents, and schedule customer follow-up after project delivery.'}
        </p>
      </div>

      {alreadyHandedOff && (
        <div className="p-3 rounded-lg bg-orange-400/10 border border-orange-400/20 text-sm text-gray-300 space-y-1">
          {isAdminView && project.supportAssignee && (
            <p>
              <Crown size={12} className="inline mr-1 text-orange-400" />
              Manager:{' '}
              <span className="text-white font-medium">{personLabel(project.supportAssignee)}</span>
            </p>
          )}
          {project.supportExecutiveAssignee && (
            <p>
              <Users size={12} className="inline mr-1 text-blue-400" />
              Primary contact:{' '}
              <span className="text-white font-medium">{personLabel(project.supportExecutiveAssignee)}</span>
            </p>
          )}
          {!isAdminView && project.supportAssignee && (
            <p>
              Handed off to{' '}
              <span className="text-white font-medium">{personLabel(project.supportAssignee)}</span>
            </p>
          )}
          {(project.supportTeamAssignees || []).length > 0 && (
            <p className="text-xs text-gray-400">
              Team: {(project.supportTeamAssignees || []).map(personLabel).join(', ')}
            </p>
          )}
          {project.supportHandoffAt && (
            <p className="text-xs text-gray-500">{new Date(project.supportHandoffAt).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {isAdminView ? (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
              <Crown size={14} className="text-orange-400" /> Support Manager *
            </label>
            <select
              className="input-field w-full"
              value={supportManager}
              onChange={(e) => setSupportManager(e.target.value)}
            >
              <option value="">Select support manager</option>
              {supportManagers.map((member) => (
                <option key={member._id} value={member._id}>
                  {personLabel(member)} · {member.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
              <Users size={14} className="text-blue-400" /> Primary support employee (customer contact) *
            </label>
            <select
              className="input-field w-full"
              value={supportExecutive}
              onChange={(e) => setSupportExecutive(e.target.value)}
            >
              <option value="">Select support employee</option>
              {supportEmployees.map((member) => (
                <option key={member._id} value={member._id}>
                  {personLabel(member)} · {member.email}
                </option>
              ))}
            </select>
          </div>

          {supportEmployees.length > 1 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Additional support employees (optional)</label>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-myth-border p-3">
                {supportEmployees
                  .filter((m) => String(m._id) !== String(supportExecutive))
                  .map((member) => (
                    <label key={member._id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={extraAssignees.includes(String(member._id))}
                        onChange={() => toggleExtraAssignee(String(member._id))}
                        className="rounded"
                      />
                      {personLabel(member)}
                      <span className="text-gray-500 text-xs">{member.email}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {isTechManagerView ? 'Support manager or agent' : 'Support team member'}
          </label>
          <select
            className="input-field w-full"
            value={supportAssignee}
            onChange={(e) => setSupportAssignee(e.target.value)}
          >
            <option value="">
              {isTechManagerView ? 'Select support manager (recommended)' : 'Select support person'}
            </option>
            {supportTeam.map((member) => (
              <option key={member._id} value={member._id}>
                {personLabel(member)}
                {member.assigneeType ? ` · ${member.assigneeType}` : ''}
                {' · '}{member.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1">Handoff notes for support</label>
        <textarea
          className="input-field w-full min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Customer context, known issues, warranty details…"
        />
      </div>

      {isTechManagerView && (
        <div className="space-y-2 p-3 rounded-lg border border-myth-border bg-myth-surface/30">
          <p className="text-sm font-medium text-white">Pre-submit checklist *</p>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={tmChecklist.developmentCompleted} onChange={(e) => setTmChecklist((c) => ({ ...c, developmentCompleted: e.target.checked }))} className="rounded" />
            Development completed
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={tmChecklist.testingCompleted} onChange={(e) => setTmChecklist((c) => ({ ...c, testingCompleted: e.target.checked }))} className="rounded" />
            Testing completed
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={tmChecklist.documentationUploaded} onChange={(e) => setTmChecklist((c) => ({ ...c, documentationUploaded: e.target.checked }))} className="rounded" />
            Documentation uploaded
          </label>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
          <FileText size={14} /> Completion documents to share with support
        </p>
        {deliveryDocs.length > 0 ? (
          <RequirementsDocLinks documents={deliveryDocs} compact />
        ) : (
          <p className="text-sm text-amber-400/90">No delivery documents yet — upload completion files first.</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleHandoff}
        disabled={submitting || (isAdminView ? !supportManager || !supportExecutive : !supportAssignee)}
        className="btn-primary text-sm inline-flex items-center gap-2"
      >
        <Send size={14} />
        {submitting
          ? 'Submitting…'
          : alreadyHandedOff
            ? 'Update support assignment'
            : isAdminView
              ? 'Deliver to support team'
              : isTechManagerView
                ? 'Submit to support manager'
                : 'Hand off to support'}
      </button>
    </div>
  );
}
