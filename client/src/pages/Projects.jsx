import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ProjectSetupForm from '../components/projects/ProjectSetupForm';
import ProjectListCard, { displayProjectStatus } from '../components/projects/ProjectListCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { projectsAPI, customersAPI, PROJECT_STATUSES, PROJECT_STATUS_KEYS } from '../services/api';
import { uploadRequirementsDocument } from '../utils/projectDocument';
import {
  emptyProjectForm,
  buildProjectCreatePayload,
  hasProjectTeamData,
  isProjectTeamComplete,
} from '../utils/projectForm';
import { usePermissions } from '../hooks/usePermissions';
import useActiveProjectCategories from '../hooks/useProjectCategories';
import { groupRequirementsByProject } from '../components/projects/RequirementsDocLinks';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminContentCard,
  AdminEmptyState,
  AdminStatStrip,
} from '../components/admin/adminUi';

const statusOptions = PROJECT_STATUS_KEYS.map((value) => ({
  value,
  label: PROJECT_STATUSES[value]?.label || value.replace(/_/g, ' '),
}));

export default function Projects({
  fixedStatus,
  overdueOnly = false,
  pageTitle,
  pageSubtitle,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canWrite, isAdmin, isManager, isTechnical } = usePermissions();
  const canManageProjects = isAdmin || isManager;
  const canAssign = canManageProjects;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(fixedStatus || '');
  const [requirementsDocs, setRequirementsDocs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyProjectForm });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [requirementsDocument, setRequirementsDocument] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const { categories: projectCategories } = useActiveProjectCategories();

  const loadRequirementsDocs = useCallback(() => {
    projectsAPI.listRequirementsDocuments()
      .then(({ data }) => setRequirementsDocs(Array.isArray(data) ? data : []))
      .catch(() => setRequirementsDocs([]));
  }, []);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = { search };
    if (statusFilter) params.status = statusFilter;
    if (overdueOnly) params.overdue = 'true';
    projectsAPI.getAll(params)
      .then(({ data }) => setProjects(data.items || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [search, statusFilter, overdueOnly]);

  useEffect(() => { loadRequirementsDocs(); }, [loadRequirementsDocs]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!canManageProjects) return;
    customersAPI.getOptions({ forModule: 'projects' })
      .then(({ data }) => setCustomerOptions((data || []).map((c) => ({ value: c._id, label: c.label }))))
      .catch(() => setCustomerOptions([]));
  }, [canManageProjects]);

  useEffect(() => {
    if (fixedStatus) setStatusFilter(fixedStatus);
  }, [fixedStatus]);

  const openCreateModal = () => {
    setCreateForm({ ...emptyProjectForm });
    setRequirementsDocument(null);
    setShowCreateModal(true);
    if (searchParams.get('add')) {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    if (searchParams.get('add') === '1' && canManageProjects && canWrite('projects')) {
      openCreateModal();
    }
  }, [searchParams.get('add')]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!createForm.name?.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!createForm.customer) {
      toast.error('Customer is required');
      return;
    }
    if (hasProjectTeamData(createForm) && !isProjectTeamComplete(createForm)) {
      toast.error('Select both a technical manager and at least one team member');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = buildProjectCreatePayload(createForm);
      const { data } = await projectsAPI.create(payload);
      const projectId = data._id || data.id;

      if (requirementsDocument && projectId) {
        try {
          await uploadRequirementsDocument(projectId, requirementsDocument);
        } catch {
          toast.error('Project created but failed to upload requirements document');
        }
      }

      toast.success('Project created');
      setShowCreateModal(false);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Delete failed');
    }
  };

  const requirementsByProject = useMemo(
    () => groupRequirementsByProject(requirementsDocs || []),
    [requirementsDocs],
  );

  const statCounts = useMemo(() => {
    const active = projects.filter((p) => !['completed', 'delivered', 'cancelled'].includes(displayProjectStatus(p))).length;
    const unassigned = projects.filter((p) => !(p.manager || (p.assignedTo || []).length)).length;
    return { total: projects.length, active, unassigned };
  }, [projects]);

  const title = pageTitle || (isTechnical ? 'My Projects' : 'All Projects');
  const subtitle = pageSubtitle || (isTechnical ? 'Projects assigned to you' : 'Overview of every customer project — status, team, budget, and requirements');

  return (
    <AdminPageShell>
      <AdminPageHeader
        icon={FolderKanban}
        title={title}
        subtitle={subtitle}
        meta={!loading && `${projects.length} project${projects.length !== 1 ? 's' : ''} in view`}
        actions={canManageProjects && canWrite('projects') && (
          <button type="button" onClick={openCreateModal} className="btn-primary text-xs lg:text-sm flex items-center gap-1 lg:gap-2">
            <Plus size={14} lg:size={18} /> Add Project
          </button>
        )}
      />

      {!loading && projects.length > 0 && !fixedStatus && !overdueOnly && (
        <AdminStatStrip stats={[
          { label: 'Total', value: statCounts.total, color: 'text-white' },
          { label: 'Active', value: statCounts.active, color: 'text-cyan-400' },
          { label: 'No team assigned', value: statCounts.unassigned, color: 'text-red-400', highlight: statCounts.unassigned > 0 },
        ]} />
      )}

      <AdminContentCard
        className="!p-0 overflow-hidden"
        toolbar={(
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full px-3 lg:px-4 pt-3 lg:pt-4">
            <div className="flex-1 min-w-[180px] sm:min-w-[200px]">
              <SearchBar value={search} onChange={setSearch} placeholder="Search projects..." />
            </div>
            {statusOptions && !fixedStatus && !overdueOnly && (
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={12} lg:size={14} className="text-gray-500" />
                <select className="input-field w-full sm:w-40 lg:w-44 text-xs lg:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      >
        {loading ? (
          <div className="p-6 lg:p-8"><LoadingSpinner /></div>
        ) : projects.length === 0 ? (
          <div className="p-6 lg:p-8"><AdminEmptyState message="No projects found" icon={FolderKanban} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3 p-3 lg:p-4 pt-2">
            {projects.map((project) => (
              <ProjectListCard
                key={project._id}
                project={project}
                requirementsDocs={requirementsByProject[project._id] || []}
                showSupportAssignee={isAdmin}
                canEdit={isTechnical || (canManageProjects && canWrite('projects'))}
                canDelete={canManageProjects && canWrite('projects')}
                editHref={`/projects/${project._id}`}
                onDelete={() => handleDelete(project._id)}
              />
            ))}
          </div>
        )}
      </AdminContentCard>

      <Modal
        isOpen={showCreateModal}
        onClose={() => !createSubmitting && setShowCreateModal(false)}
        title="Add Project"
        size="xl"
      >
        <ProjectSetupForm
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create Project"
          cancelLabel="Cancel"
          submitting={createSubmitting}
          customerOptions={customerOptions}
          projectCategories={projectCategories}
          requirementsDocument={requirementsDocument}
          setRequirementsDocument={setRequirementsDocument}
          canAssignTeam={canAssign}
        />
      </Modal>
    </AdminPageShell>
  );
}
