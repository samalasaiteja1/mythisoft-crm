import { useState, useEffect } from 'react';
import { Users, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, usersAPI } from '../../services/api';
import { inferTeamDepartment } from '../../utils/roleContext';
import { mergeTeamMemberRecords } from '../../constants/techTeamForm';
import RequirementsDocumentField from '../projects/RequirementsDocumentField';
import TechnicalTeamMemberPicker from '../projects/TechnicalTeamMemberPicker';

const dedupeMembers = mergeTeamMemberRecords;

export default function CustomerProjectSetupSteps({
  form,
  setForm,
  requirementsDocument,
  setRequirementsDocument,
  canAssign = true,
}) {
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const team = form.projectTeam || { manager: '', assignedTo: [], memberRoles: {} };
  const selectedManager = team.manager || '';
  const selected = team.assignedTo || [];
  const memberRoles = team.memberRoles || {};

  const setTeam = (patch) => {
    setForm((prev) => {
      const currentTeam = prev.projectTeam || { manager: '', assignedTo: [], memberRoles: {} };
      return {
        ...prev,
        projectTeam: { ...currentTeam, ...patch },
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const techMembers = [];
        try {
          const { data } = await projectsAPI.getTechnicalTeam();
          (data?.members || []).forEach((m) => techMembers.push(m));
        } catch {
          // ignore
        }
        try {
          const { data: allUsers } = await usersAPI.getAll();
          (allUsers || []).filter((u) => u.role === 'technical' && u.isActive !== false).forEach((u) => techMembers.push(u));

          const allManagers = (allUsers || []).filter((u) => u.role === 'manager' && u.isActive !== false);
          const techManagers = allManagers.filter((u) => {
            const dept = inferTeamDepartment(u.staffRole);
            if (dept === 'technical') return true;
            const deptName = String(u.departmentName || '').toLowerCase();
            return deptName.includes('tech');
          });
          setManagers(techManagers.length ? techManagers : allManagers);
        } catch {
          // ignore
        }
        setMembers(dedupeMembers(techMembers));
      } catch {
        toast.error('Failed to load technical team');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTeamChange = ({ assignedTo, memberRoles: roles }) => {
    setTeam({ assignedTo, memberRoles: roles });
  };

  return (
    <div className="space-y-6 pt-4 border-t border-myth-border">
      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Users size={14} className="text-myth-accent" />
          Step 1 — Assign technical team
        </p>
        <div className="rounded-lg border border-myth-accent/30 bg-myth-surface/20 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Technical team</h4>
            <p className="text-xs text-gray-500 mt-1">
              Assign technical manager. Filter by Technical department roles (from Settings), then set each member&apos;s project role.
            </p>
          </div>

          <TechnicalTeamMemberPicker
            managers={managers}
            members={members}
            loading={loading}
            canAssign={canAssign}
            selectedManager={selectedManager}
            onManagerChange={(id) => setTeam({ manager: id })}
            selectedMemberIds={selected}
            memberRoles={memberRoles}
            onTeamChange={handleTeamChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Inbox size={14} className="text-cyan-400" />
          Step 2 — Requirements & documents
        </p>

        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Inbox size={16} className="text-cyan-400" />
            Requirements sent to technical team
          </h4>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Upload requirements from the deal or attach new files before advancing to Development
          </p>
          {!requirementsDocument ? (
            <p className="text-sm text-gray-500 mb-3">No requirements document received yet</p>
          ) : (
            <p className="text-sm text-white mb-3">{requirementsDocument.name}</p>
          )}
          {setRequirementsDocument && (
            <RequirementsDocumentField
              label="Upload requirements document"
              file={requirementsDocument}
              onChange={setRequirementsDocument}
            />
          )}
        </div>

        <div className="pt-3 border-t border-myth-border">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Inbox size={16} className="text-orange-400" />
            Customer submitted requirements
          </h4>
          <p className="text-xs text-gray-500 mt-1 mb-2">Documents uploaded by the customer from their portal</p>
          <p className="text-sm text-gray-500">No customer requirements submitted yet</p>
        </div>
      </div>
    </div>
  );
}
