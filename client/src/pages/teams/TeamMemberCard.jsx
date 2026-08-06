const ROLE_LABELS = {
  manager: 'Manager',
  sales: 'Sales Person',
  technical: 'Technical Person',
  support: 'Support Person',
  admin: 'Admin',
};

const managerLabelForRole = (role) => ({
  sales: 'Sales Manager',
  technical: 'Technical Manager',
  support: 'Support Manager',
  manager: 'Manager',
}[role] || 'Manager');

export default function TeamMemberCard({ member, isLeader = false, compact = false }) {
  const manager = member.reportsTo;
  const roleLabel = ROLE_LABELS[member.role] || member.role;

  if (compact) {
    return (
      <div className="rounded-lg bg-myth-surface/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-white font-medium text-sm">
              {member.firstName} {member.lastName}
              {isLeader && <span className="ml-2 badge bg-myth-accent/20 text-myth-accent text-[10px]">Leader</span>}
            </p>
            <p className="text-xs text-gray-400">{roleLabel}{member.employeeId ? ` · ${member.employeeId}` : ''}</p>
          </div>
        </div>
        <div className="text-xs">
          <span className="text-gray-500">{managerLabelForRole(member.role)}: </span>
          {manager ? (
            <span className="text-myth-accent">
              {manager.firstName} {manager.lastName}
              {manager.staffRole?.name ? ` (${manager.staffRole.name})` : ''}
            </span>
          ) : (
            <span className="text-gray-500">Not assigned</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${isLeader ? 'ring-1 ring-myth-accent/40' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent text-sm font-bold shrink-0">
          {member.firstName?.[0]}{member.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold flex flex-wrap items-center gap-2">
            {member.firstName} {member.lastName}
            {isLeader && <span className="badge bg-myth-accent/20 text-myth-accent text-xs">Team Lead</span>}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">{roleLabel}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {member.employeeId && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Employee ID</span>
            <span className="text-gray-300 font-mono">{member.employeeId}</span>
          </div>
        )}
        {member.email && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-300 truncate">{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Phone</span>
            <span className="text-gray-300">{member.phone}</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">Status</span>
          <span className={member.isActive !== false ? 'text-green-400' : 'text-red-400'}>
            {member.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-myth-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          {managerLabelForRole(member.role)}
        </p>
        {manager ? (
          <div className="rounded-lg bg-myth-surface/50 p-3 space-y-1">
            <p className="text-white font-medium">
              {manager.firstName} {manager.lastName}
            </p>
            {manager.employeeId && (
              <p className="text-xs text-gray-400 font-mono">{manager.employeeId}</p>
            )}
            {manager.staffRole?.name && (
              <p className="text-xs text-myth-accent">Team: {manager.staffRole.name}</p>
            )}
            {manager.email && (
              <p className="text-xs text-gray-500">{manager.email}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No manager assigned</p>
        )}
      </div>
    </div>
  );
}

export { ROLE_LABELS, managerLabelForRole };
