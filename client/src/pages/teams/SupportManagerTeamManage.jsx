import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Users, Eye, Pencil, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { staffRolesAPI, usersAPI, departmentsAPI, formatDate } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import SupportManagerCreateTeamForm from '../../components/supportManager/SupportManagerCreateTeamForm';
import SupportAssignTeamToProjectModal from '../../components/supportManager/SupportAssignTeamToProjectModal';
import { filterSupportTeamsByScope } from '../../utils/supportTeamOwnership';

export default function SupportManagerTeamManage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supportDeptId, setSupportDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes, deptRes] = await Promise.all([
        staffRolesAPI.getAll({ teamGroup: 'support' }),
        usersAPI.getAll({ forTeamPick: '1' }),
        departmentsAPI.getAll(),
      ]);
      const allTeams = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data?.items || [];
      setTeams(filterSupportTeamsByScope(allTeams, user?._id));
      setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);
      const depts = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.items || [];
      const supportDept = depts.find((d) => String(d.name || '').toLowerCase().includes('support'));
      setSupportDeptId(supportDept ? String(supportDept._id) : '');
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membersByTeam = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const tid = String(e.staffRole?._id || e.staffRole || '');
      if (!tid) return;
      if (!map[tid]) map[tid] = [];
      map[tid].push(e);
    });
    return map;
  }, [employees]);

  const openCreate = () => {
    setSelectedTeam(null);
    setModal('form');
  };

  const openEdit = (team) => {
    setSelectedTeam(team);
    setModal('form');
  };

  const openDetail = (team) => {
    setSelectedTeam(team);
    setModal('detail');
  };

  const openAssign = (team) => {
    setSelectedTeam(team);
    setModal('assign');
  };

  const detailMembers = selectedTeam ? (membersByTeam[String(selectedTeam._id)] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Teams</h1>
          <p className="text-gray-400 mt-1">
            Create working groups from Support department employees and assign them to projects.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Create Team
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Teams</p>
          <p className="text-2xl font-bold text-white mt-1">{teams.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{teams.filter((t) => t.status === 'active').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Members</p>
          <p className="text-2xl font-bold text-white mt-1">
            {Object.values(membersByTeam).reduce((n, arr) => n + arr.length, 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{employees.length}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-myth-border text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="table-cell">Team Name</th>
                  <th className="table-cell">Project</th>
                  <th className="table-cell">Code</th>
                  <th className="table-cell">Members</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Created Date</th>
                  <th className="table-cell text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {teams.length ? teams.map((team) => {
                  const count = membersByTeam[String(team._id)]?.length || 0;
                  return (
                    <tr key={team._id} className="border-b border-myth-border/60 hover:bg-myth-surface/30">
                      <td className="table-cell font-medium text-white">{team.name}</td>
                      <td className="table-cell text-gray-400">{team.projectRef?.name || '—'}</td>
                      <td className="table-cell text-gray-400">{team.code}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1 text-gray-300">
                          <Users size={14} /> {count}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded text-xs capitalize ${team.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {team.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400">{formatDate(team.createdAt)}</td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openDetail(team)} className="btn-ghost text-xs inline-flex items-center gap-1">
                            <Eye size={14} /> View
                          </button>
                          <button type="button" onClick={() => openEdit(team)} className="btn-ghost text-xs inline-flex items-center gap-1">
                            <Pencil size={14} /> Edit
                          </button>
                          {team.status === 'active' && (
                            <button type="button" onClick={() => openAssign(team)} className="btn-ghost text-xs inline-flex items-center gap-1 text-myth-accent">
                              <FolderKanban size={14} /> Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="table-cell text-center py-12 text-gray-500">
                      No teams yet. Create your first support working group.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={selectedTeam ? 'Edit Support Team' : 'Create Support Team'}
        size="xl"
      >
        <SupportManagerCreateTeamForm
          key={selectedTeam?._id || 'create'}
          team={selectedTeam}
          supportDepartmentId={supportDeptId}
          user={user}
          onCancel={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadData();
          }}
        />
      </Modal>

      <Modal
        isOpen={modal === 'detail'}
        onClose={() => setModal(null)}
        title="Team Details"
        size="xl"
      >
        {selectedTeam && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Team Name</p>
                <p className="text-white font-medium">{selectedTeam.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Project</p>
                <p className="text-white font-medium">{selectedTeam.projectRef?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Team Code</p>
                <p className="text-white font-medium">{selectedTeam.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-white capitalize">{selectedTeam.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-white">{formatDate(selectedTeam.createdAt)}</p>
              </div>
            </div>

            {selectedTeam.remarks && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-gray-300 text-sm">{selectedTeam.remarks}</p>
              </div>
            )}

            {selectedTeam.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-gray-300 text-sm">{selectedTeam.description}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Team Members</h4>
                <button type="button" onClick={() => openEdit(selectedTeam)} className="text-sm text-myth-accent hover:underline">
                  Edit Team
                </button>
              </div>
              <div className="overflow-x-auto border border-myth-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-myth-border text-left text-xs uppercase text-gray-500">
                      <th className="table-cell">Employee ID</th>
                      <th className="table-cell">Name</th>
                      <th className="table-cell">Email</th>
                      <th className="table-cell">Phone</th>
                      <th className="table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailMembers.length ? detailMembers.map((m) => (
                      <tr key={m._id} className="border-b border-myth-border/60">
                        <td className="table-cell text-gray-400">{m.employeeId || '—'}</td>
                        <td className="table-cell text-white">{m.firstName} {m.lastName}</td>
                        <td className="table-cell text-gray-400">{m.email}</td>
                        <td className="table-cell text-gray-400">{m.phone || '—'}</td>
                        <td className="table-cell">
                          <span className={m.isActive !== false ? 'text-green-400' : 'text-gray-500'}>
                            {m.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="table-cell text-center py-8 text-gray-500">No members assigned</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Close</button>
              {selectedTeam.status === 'active' && (
                <button type="button" onClick={() => openAssign(selectedTeam)} className="btn-primary">
                  Assign Project
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modal === 'assign'}
        onClose={() => setModal(null)}
        title="Assign Team to Project"
        size="lg"
      >
        <SupportAssignTeamToProjectModal
          teams={teams}
          preselectedTeamId={selectedTeam?._id || ''}
          onCancel={() => setModal(null)}
          onAssigned={() => {
            setModal(null);
            toast.success('Team assigned — you can submit the project to the customer from Project Delivery.');
          }}
        />
      </Modal>
    </div>
  );
}
