import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown, Users, Search, Mail, Phone, Building2, Calendar, Briefcase,
  UserCircle, Eye, Trash2, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../services/api';
import { formatDate } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import EditHiredStaffModal from './EditHiredStaffModal';
import { roleLabel, departmentLabel } from '../../utils/hireFormHelpers';
import { getManagerDepartment } from '../../utils/roleContext';

const EMPLOYEE_ROLES = ['sales', 'technical', 'support'];
const EMPLOYMENT_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
};

const SHIFT_LABELS = {
  general: 'General',
  morning: 'Morning',
  evening: 'Evening',
  night: 'Night',
};

function personName(p) {
  return `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—';
}

function deptLabel(person) {
  if (person.department?.name) return person.department.name;
  if (person.departmentName) return person.departmentName;
  if (person.role === 'manager') {
    const d = getManagerDepartment(person);
    return departmentLabel(d);
  }
  return roleLabel(person.role);
}

function teamLabel(person) {
  const t = person.staffRole;
  if (!t) return '—';
  if (typeof t === 'object') return t.name || '—';
  return '—';
}

function jobTitle(person) {
  return person.roleId?.name || person.hrProfile?.designation || '—';
}

function managerName(person) {
  const m = person.reportsTo;
  if (!m) return '—';
  if (typeof m === 'object') return personName(m);
  return '—';
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
        {Icon && <Icon size={13} />} {label}
      </span>
      <span className="text-gray-300 text-right">{value}</span>
    </div>
  );
}

function HiredPersonCard({ person, onView, onEdit, onDelete, deleting }) {
  return (
    <div className="card border border-myth-border/80 hover:border-myth-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold truncate">{personName(person)}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {person.employeeId ? `ID: ${person.employeeId}` : 'No employee ID'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`badge ${person.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {person.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            type="button"
            onClick={() => onEdit(person)}
            className="p-2 rounded-lg hover:bg-myth-accent/10 text-gray-400 hover:text-myth-accent"
            title="Edit staff"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(person)}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 disabled:opacity-50"
            title="Delete hired staff"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <InfoRow icon={Briefcase} label="Job Title" value={jobTitle(person)} />
        <InfoRow icon={Building2} label="Department" value={deptLabel(person)} />
        <InfoRow icon={Users} label="Team" value={teamLabel(person)} />
        {person.role !== 'manager' && (
          <InfoRow icon={Crown} label="Reports To" value={managerName(person)} />
        )}
        <InfoRow icon={Mail} label="Email" value={person.email} />
        <InfoRow icon={Phone} label="Phone" value={person.phone} />
        <InfoRow icon={Calendar} label="Joined" value={person.joiningDate ? formatDate(person.joiningDate) : null} />
        <InfoRow
          label="Employment"
          value={EMPLOYMENT_LABELS[person.employmentType] || person.employmentType}
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => onEdit(person)} className="btn-primary flex-1 text-sm inline-flex items-center justify-center gap-2">
          <Pencil size={14} /> Edit
        </button>
        <button type="button" onClick={() => onView(person)} className="btn-secondary flex-1 text-sm inline-flex items-center justify-center gap-2">
          <Eye size={14} /> View
        </button>
      </div>
    </div>
  );
}

function PersonDetailModal({ person, onClose, onEdit }) {
  if (!person) return null;
  const hr = person.hrProfile || {};

  const sections = [
    {
      title: 'Personal',
      rows: [
        ['Full Name', personName(person)],
        ['Employee ID', person.employeeId],
        ['Gender', hr.gender],
        ['Date of Birth', hr.dateOfBirth ? formatDate(hr.dateOfBirth) : null],
        ['Personal Email', hr.personalEmail],
        ['Phone', person.phone],
        ['Login Email', person.email],
      ],
    },
    {
      title: 'Employment',
      rows: [
        ['System Role', roleLabel(person.role)],
        ['Job Title', jobTitle(person)],
        ['Department', deptLabel(person)],
        ['Team', teamLabel(person)],
        ['Reporting Manager', managerName(person)],
        ['Joining Date', person.joiningDate ? formatDate(person.joiningDate) : null],
        ['Employment Type', EMPLOYMENT_LABELS[person.employmentType]],
        ['Work Location', hr.workLocation],
        ['Shift', SHIFT_LABELS[hr.shift] || hr.shift],
        ['Status', person.isActive ? 'Active' : 'Inactive'],
      ],
    },
    {
      title: 'Salary & Bank',
      rows: [
        ['Salary', hr.salary != null ? `₹${Number(hr.salary).toLocaleString('en-IN')}` : null],
        ['Salary Type', hr.salaryType],
        ['Bank', hr.bankName],
        ['Account Holder', hr.accountHolderName],
        ['Account Number', hr.accountNumber],
        ['IFSC', hr.ifscCode],
      ],
    },
    {
      title: 'Skills',
      rows: [
        ['Qualification', hr.highestQualification],
        ['Experience (years)', hr.experienceYears != null ? String(hr.experienceYears) : null],
        ['Primary Skill', hr.primarySkill],
        ['Secondary Skill', hr.secondarySkill],
        ['Certifications', hr.certifications],
      ],
    },
    {
      title: 'Address',
      rows: [
        ['Address', hr.address],
        ['City', hr.city],
        ['State', hr.state],
        ['Country', hr.country],
        ['PIN', hr.pinCode],
      ],
    },
    {
      title: 'Emergency Contact',
      rows: [
        ['Name', hr.emergencyContactName],
        ['Relationship', hr.emergencyContactRelationship],
        ['Phone', hr.emergencyContactPhone],
      ],
    },
    {
      title: 'Documents',
      rows: [
        ['Resume', hr.documents?.resume],
        ['Aadhaar', hr.documents?.aadhaar],
        ['PAN', hr.documents?.pan],
        ['Certificates', hr.documents?.educationalCertificates],
        ['Photo', hr.documents?.passportPhoto],
      ],
    },
    {
      title: 'Additional',
      rows: [['Remarks', hr.remarks]],
    },
  ];

  return (
    <Modal isOpen onClose={onClose} title={personName(person)} size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {sections.map((section) => {
          const visible = section.rows.filter(([, v]) => v && String(v).trim());
          if (!visible.length) return null;
          return (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-myth-accent mb-2">{section.title}</h4>
              <div className="rounded-lg border border-myth-border bg-myth-surface/30 p-3 space-y-2">
                {visible.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="text-gray-200 text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="text-xs text-gray-500 pt-2 border-t border-myth-border">
          Hired on {formatDate(person.createdAt)}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Close</button>
          <button
            type="button"
            onClick={() => { onClose(); onEdit(person); }}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function HiredStaffSettings() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('managers');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [detailPerson, setDetailPerson] = useState(null);
  const [editPerson, setEditPerson] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPeople = () => {
    setLoading(true);
    usersAPI.getAll()
      .then(({ data }) => setPeople(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load hired staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const managers = useMemo(
    () => people.filter((p) => p.role === 'manager' && p.role !== 'admin'),
    [people]
  );

  const employees = useMemo(
    () => people.filter((p) => EMPLOYEE_ROLES.includes(p.role)),
    [people]
  );

  const deptOptions = useMemo(() => {
    const keys = new Set();
    [...managers, ...employees].forEach((p) => {
      const d = getManagerDepartment(p);
      if (p.role === 'manager') keys.add(d);
      else keys.add(p.role);
    });
    return Array.from(keys);
  }, [managers, employees]);

  const filterList = (list) => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (deptFilter !== 'all') {
        const key = p.role === 'manager' ? getManagerDepartment(p) : p.role;
        if (key !== deptFilter) return false;
      }
      if (!q) return true;
      const hay = [
        personName(p),
        p.email,
        p.phone,
        p.employeeId,
        jobTitle(p),
        deptLabel(p),
        teamLabel(p),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  };

  const filteredManagers = filterList(managers);
  const filteredEmployees = filterList(employees);
  const activeList = view === 'managers' ? filteredManagers : filteredEmployees;

  const handleDelete = async (person) => {
    const label = personName(person);
    if (!confirm(`Delete ${label}? This removes their login and cannot be undone.`)) return;
    setDeletingId(person._id);
    try {
      await usersAPI.delete(person._id);
      toast.success(`${label} removed`);
      if (detailPerson?._id === person._id) setDetailPerson(null);
      fetchPeople();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={18} className="text-myth-accent" /> Hired Staff
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          All people hired through Settings — managers and employees listed separately with full profile details.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400 flex items-center gap-1"><Crown size={12} /> Managers</p>
          <p className="text-2xl font-bold text-purple-400">{managers.length}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400 flex items-center gap-1"><UserCircle size={12} /> Employees</p>
          <p className="text-2xl font-bold text-blue-400">{employees.length}</p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {managers.filter((m) => m.isActive).length + employees.filter((e) => e.isActive).length}
          </p>
        </div>
        <div className="card py-3 px-4">
          <p className="text-xs text-gray-400">Total Hired</p>
          <p className="text-2xl font-bold text-white">{managers.length + employees.length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('managers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              view === 'managers' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-myth-surface text-gray-400'
            }`}
          >
            <Crown size={14} /> Managers ({managers.length})
          </button>
          <button
            type="button"
            onClick={() => setView('employees')}
            className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${
              view === 'employees' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-myth-surface text-gray-400'
            }`}
          >
            <Users size={14} /> Employees ({employees.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, ID…"
              className="input-field w-full pl-9 text-sm"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field text-sm min-w-[140px]"
          >
            <option value="all">All departments</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>{departmentLabel(d)}</option>
            ))}
          </select>
        </div>
      </div>

      {view === 'managers' && managers.length === 0 && (
        <div className="text-center py-12 border border-dashed border-myth-border rounded-xl">
          <Crown className="mx-auto text-gray-600 mb-3" size={32} />
          <p className="text-gray-400 mb-3">No managers hired yet.</p>
          <Link to="/settings?tab=hire-manager" className="btn-primary text-sm">Hire Manager</Link>
        </div>
      )}

      {view === 'employees' && employees.length === 0 && (
        <div className="text-center py-12 border border-dashed border-myth-border rounded-xl">
          <Users className="mx-auto text-gray-600 mb-3" size={32} />
          <p className="text-gray-400 mb-3">No employees hired yet.</p>
          <Link to="/settings?tab=hire" className="btn-primary text-sm">Hire Employee</Link>
        </div>
      )}

      {activeList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeList.map((person) => (
            <HiredPersonCard
              key={person._id}
              person={person}
              onView={setDetailPerson}
              onEdit={setEditPerson}
              onDelete={handleDelete}
              deleting={deletingId === person._id}
            />
          ))}
        </div>
      )}

      {activeList.length === 0 && (view === 'managers' ? managers.length > 0 : employees.length > 0) && (
        <p className="text-center text-gray-500 py-8">No matches for your search or filter.</p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/settings?tab=hire-manager" className="text-sm text-myth-accent hover:underline">Hire Manager</Link>
        <span className="text-gray-600">·</span>
        <Link to="/settings?tab=hire" className="text-sm text-myth-accent hover:underline">Hire Employee</Link>
        <span className="text-gray-600">·</span>
        <Link to="/users" className="text-sm text-gray-400 hover:text-white">Full Users page</Link>
      </div>

      {detailPerson && (
        <PersonDetailModal
          person={detailPerson}
          onClose={() => setDetailPerson(null)}
          onEdit={setEditPerson}
        />
      )}

      {editPerson && (
        <EditHiredStaffModal
          person={editPerson}
          onClose={() => setEditPerson(null)}
          onSaved={fetchPeople}
        />
      )}
    </div>
  );
}
