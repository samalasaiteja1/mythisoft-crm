import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, usersAPI } from '../../services/api';
import { inferTeamDepartment } from '../../utils/roleContext';
import { defaultMemberRole, mapMemberRoleLabels, mergeTeamMemberRecords } from '../../constants/techTeamForm';
import TechnicalTeamMemberPicker from './TechnicalTeamMemberPicker';

const dedupeMembers = mergeTeamMemberRecords;

export default forwardRef(function ProjectTeamAssign({
  projectId,
  assignedTo = [],
  manager = null,
  memberRoleLabels: memberRoleLabelsProp,
  onAssigned,
  canAssign,
  embedded = false,
  showInlineSave = true,
}, ref) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [memberRoles, setMemberRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const techMembers = [];
        let teamRes = null;
        try {
          const { data } = await projectsAPI.getTechnicalTeam();
          teamRes = data.team || null;
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
        setTeam(teamRes);
        setMembers(dedupeMembers(techMembers));
      } catch {
        toast.error('Failed to load technical team');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const ids = (assignedTo || []).map((u) => String(typeof u === 'object' ? u._id : u)).filter(Boolean);
    setSelected(ids);
    const stored = mapMemberRoleLabels(memberRoleLabelsProp);
    const roles = { ...stored };
    ids.forEach((id) => {
      if (!roles[id]) {
        const u = (assignedTo || []).find((x) => String(x?._id || x) === id);
        const emp = typeof u === 'object' ? u : members.find((m) => String(m._id) === id);
        roles[id] = defaultMemberRole(emp, []);
      }
    });
    setMemberRoles(roles);
  }, [assignedTo, memberRoleLabelsProp, members]);

  useEffect(() => {
    const id = manager && typeof manager === 'object' ? manager._id : manager;
    setSelectedManager(id ? String(id) : '');
  }, [manager]);

  const handleTeamChange = ({ assignedTo, memberRoles: roles }) => {
    setSelected(assignedTo.map(String));
    setMemberRoles(roles);
  };

  const handleSave = async (silent = false) => {
    if (!selectedManager) {
      if (!silent) toast.error('Select a technical manager');
      throw new Error('Technical manager required');
    }
    if (!selected.length) {
      if (!silent) toast.error('Select at least one technical team member');
      throw new Error('Technical team required');
    }
    setSaving(true);
    try {
      const { data } = await projectsAPI.assignTeam(projectId, {
        assignedTo: selected,
        manager: selectedManager || '',
        memberRoleLabels: memberRoles,
      });
      if (!silent) toast.success('Technical manager and team assigned');
      onAssigned?.(data);
      return data;
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || 'Failed to assign team');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSave(true),
    canSubmit: () => Boolean(selectedManager && selected.length > 0),
  }));

  return (
    <div className={embedded ? 'space-y-4' : 'card space-y-4'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-myth-accent" />
            <h2 className="text-lg font-semibold text-white">Technical team</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {team?.name
              ? `${team.name} — assign technical manager and engineers by role`
              : 'Assign technical manager and pick team members from different roles'}
          </p>
        </div>
        {canAssign && showInlineSave && (
          <button type="button" onClick={() => handleSave()} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 shrink-0">
            <Send size={14} />
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>

      <TechnicalTeamMemberPicker
        managers={managers}
        members={members}
        loading={loading}
        canAssign={canAssign}
        selectedManager={selectedManager}
        onManagerChange={setSelectedManager}
        selectedMemberIds={selected}
        memberRoles={memberRoles}
        onTeamChange={handleTeamChange}
      />
    </div>
  );
});
