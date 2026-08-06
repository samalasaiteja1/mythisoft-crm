import { Link } from 'react-router-dom';
import { MANAGER_DEPARTMENT_OPTIONS, defaultManagerTeamId } from '../../utils/hireFormHelpers';

/**
 * Pick Sales Manager, Technical Manager, or Support Manager — one choice, team auto-assigned.
 */
export default function ManagerTypePicker({
  departmentKey,
  staffRole,
  teamsByDept,
  managersByDept = {},
  onSelect,
  compact = false,
}) {
  const teamsForDept = departmentKey ? teamsByDept[departmentKey] || [] : [];
  const selectedTeam = teamsForDept.find((t) => String(t._id) === String(staffRole))
    || teamsForDept[0];

  const handleSelect = (deptKey) => {
    const teamId = defaultManagerTeamId(deptKey, teamsByDept);
    onSelect(deptKey, teamId);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Manager type *</label>
        <p className="text-xs text-gray-500 mb-3">
          Choose one — Sales Manager, Technical Manager, or Support Manager. The correct dashboard and team are assigned automatically.
        </p>
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {MANAGER_DEPARTMENT_OPTIONS.map((dept) => {
            const teams = teamsByDept[dept.key] || [];
            const existing = managersByDept[dept.key] || [];
            const selected = departmentKey === dept.key;
            const disabled = teams.length === 0;
            return (
              <button
                key={dept.key}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(dept.key)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  selected
                    ? 'border-blue-400 bg-blue-500/15 ring-1 ring-blue-400/30'
                    : disabled
                      ? 'border-myth-border/50 opacity-50 cursor-not-allowed'
                      : 'border-myth-border hover:border-blue-400/50'
                }`}
              >
                <p className="text-white font-semibold">{dept.label}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {teams.length
                    ? teams[0]?.name || 'Manager team ready'
                    : 'No team — create in Settings → Teams'}
                </p>
                {existing.length > 0 && (
                  <p className="text-xs text-amber-400/90 mt-2">
                    {existing.length} already hired
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {departmentKey && teamsForDept.length === 0 && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
          No manager team for this type. Create it in{' '}
          <Link to="/settings?tab=teams" className="underline font-medium">Settings → Teams</Link>
          {' '}(e.g. Sales Managers, Tech Managers, Support Managers).
        </div>
      )}

      {departmentKey && selectedTeam && (
        <p className="text-sm text-gray-400">
          Assigned team: <span className="text-white">{selectedTeam.name}</span>
          {selectedTeam.code && <span className="text-gray-500"> · {selectedTeam.code}</span>}
        </p>
      )}

      {departmentKey && teamsForDept.length > 1 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Manager team (if multiple)</label>
          <select
            className="input-field w-full"
            value={staffRole}
            onChange={(e) => onSelect(departmentKey, e.target.value)}
          >
            {teamsForDept.map((team) => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
