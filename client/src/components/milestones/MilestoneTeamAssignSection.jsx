import { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, usersAPI, rolesAPI, departmentsAPI } from '../../services/api';
import { inferTeamDepartment } from '../../utils/roleContext';
import {
  mergeTeamMemberRecords,
  mapMemberRoleLabels,
  buildRolesFromAssignedMembers,
  findTechnicalDepartment,
  filterRolesForTechnicalDepartment,
} from '../../constants/techTeamForm';
import CustomerTechAssignmentBadge from '../customers/CustomerTechAssignmentBadge';
import CustomerSupportAssignmentBadge from '../customers/CustomerSupportAssignmentBadge';
import ProjectTechAssignmentBadge from '../projects/ProjectTechAssignmentBadge';
import TechnicalTeamMemberPicker from '../projects/TechnicalTeamMemberPicker';

const teamFromProject = (project) => {
  if (!project) return { manager: '', assignedTo: [], memberRoles: {} };
  const ids = (project.assignedTo || []).map((u) => String(typeof u === 'object' ? u._id : u)).filter(Boolean);
  const stored = mapMemberRoleLabels(project);
  const memberRoles = { ...stored };
  ids.forEach((id) => {
    if (!memberRoles[id]) {
      const u = (project.assignedTo || []).find((x) => String(x?._id || x) === id);
      memberRoles[id] = u?.assignedProjectRole || u?.roleId?.name || '';
    }
  });
  const manager = project.manager?._id || project.manager || '';
  return { manager: manager ? String(manager) : '', assignedTo: ids, memberRoles };
};

const enrichAssigneesFromProject = (project) => {
  const labels = mapMemberRoleLabels(project);
  return (project?.assignedTo || []).map((u) => {
    if (!u || typeof u !== 'object') return u;
    const id = String(u._id);
    return {
      ...u,
      assignedProjectRole: labels[id] || u.assignedProjectRole || null,
    };
  });
};

export default function MilestoneTeamAssignSection({
  projectId,
  team,
  onTeamChange,
  canAssign = true,
  hideManager = false,
  showAssignmentBadges = true,
  projectMembersOnly = true,
}) {
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projectDetail, setProjectDetail] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [technicalDept, setTechnicalDept] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedManager = team?.manager || '';
  const selected = team?.assignedTo || [];
  const memberRoles = team?.memberRoles || {};

  useEffect(() => {
    let cancelled = false;
    Promise.all([rolesAPI.getAll(), departmentsAPI.getAll()])
      .then(([rolesRes, deptRes]) => {
        if (cancelled) return;
        const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.items || [];
        const departments = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.items || [];
        const techDept = findTechnicalDepartment(departments);
        setTechnicalDept(techDept || null);
        setJobRoles(roles.filter((r) => r.status !== 'inactive'));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadManagers = async () => {
      try {
        const { data: allUsers } = await usersAPI.getAll();
        const allManagers = (allUsers || []).filter((u) => u.role === 'manager' && u.isActive !== false);
        const techManagers = allManagers.filter((u) => {
          const dept = inferTeamDepartment(u.staffRole);
          if (dept === 'technical') return true;
          const deptName = String(u.departmentName || '').toLowerCase();
          return deptName.includes('tech');
        });
        if (!cancelled) setManagers(techManagers.length ? techManagers : allManagers);
      } catch {
        // ignore
      }
    };
    loadManagers();
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProjectDetail(null);
      setMembers([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const { data: project } = await projectsAPI.getOne(projectId);
        if (cancelled) return;
        setProjectDetail(project);

        const assignees = enrichAssigneesFromProject(project);
        let pool = [...assignees];

        if (projectMembersOnly) {
          try {
            const { data: pickUsers } = await usersAPI.getAll({ projectId, forTeamPick: '1' });
            if (Array.isArray(pickUsers) && pickUsers.length) {
              pool = mergeTeamMemberRecords([...assignees, ...pickUsers]);
            } else {
              pool = mergeTeamMemberRecords(assignees);
            }
          } catch {
            pool = mergeTeamMemberRecords(assignees);
          }
        } else {
          const techMembers = [];
          try {
            const { data } = await projectsAPI.getTechnicalTeam();
            (data?.members || []).forEach((m) => techMembers.push(m));
          } catch {
            // ignore
          }
          try {
            const { data: allUsers } = await usersAPI.getAll();
            (allUsers || []).filter((u) => u.role === 'technical' && u.isActive !== false).forEach((u) => {
              techMembers.push(u);
            });
          } catch {
            // ignore
          }
          pool = mergeTeamMemberRecords([...assignees, ...techMembers]);
        }

        if (!cancelled) setMembers(pool);
      } catch {
        if (!cancelled) {
          toast.error('Failed to load project team');
          setProjectDetail(null);
          setMembers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, projectMembersOnly]);

  const rolesForPick = useMemo(() => {
    const deptRoles = filterRolesForTechnicalDepartment(jobRoles, technicalDept?._id);
    if (projectMembersOnly && members.length) {
      return buildRolesFromAssignedMembers(members, deptRoles);
    }
    return deptRoles;
  }, [jobRoles, technicalDept, members, projectMembersOnly]);

  const handleTeamChange = ({ assignedTo, memberRoles: roles }) => {
    onTeamChange?.({ ...team, assignedTo, memberRoles: roles });
  };

  const customer = projectDetail?.customer;
  const assigneeCount = (projectDetail?.assignedTo || []).length;

  return (
    <div className="space-y-4 rounded-lg border border-myth-accent/30 bg-myth-surface/20 p-4">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Users size={14} className="text-myth-accent" />
          Milestone team
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {projectMembersOnly
            ? 'Pick engineers from this project\'s admin-assigned team who will work on this milestone phase.'
            : 'Assign technical manager, filter by role, and set each member\'s project role.'}
        </p>
        {projectMembersOnly && assigneeCount > 0 && (
          <p className="text-xs text-cyan-400/90 mt-1">
            {assigneeCount} engineer{assigneeCount === 1 ? '' : 's'} available from project assignment
          </p>
        )}
      </div>

      {showAssignmentBadges && projectDetail && (
        <div className="space-y-1.5 pt-1 border-t border-myth-border/50">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Project & customer assignment</p>
          <ProjectTechAssignmentBadge project={projectDetail} />
          {customer && (
            <>
              <CustomerTechAssignmentBadge customer={customer} />
              <CustomerSupportAssignmentBadge customer={customer} />
            </>
          )}
        </div>
      )}

      <TechnicalTeamMemberPicker
        managers={managers}
        members={members}
        loading={loading}
        canAssign={canAssign}
        selectedManager={selectedManager}
        onManagerChange={(id) => onTeamChange?.({ ...team, manager: id })}
        selectedMemberIds={selected}
        memberRoles={memberRoles}
        onTeamChange={handleTeamChange}
        showManagerDropdown={!hideManager}
        rolesForPickOverride={rolesForPick}
        emptyMembersHint={
          projectMembersOnly
            ? 'All project engineers are already selected, or admin has not assigned engineers to this project yet.'
            : undefined
        }
      />
    </div>
  );
}

export { teamFromProject };
