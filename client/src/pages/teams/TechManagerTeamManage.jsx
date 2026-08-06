import { UsersRound } from 'lucide-react';
import StaffRolesSettings from '../../components/settings/StaffRolesSettings';
import { TechManagerPageHeader } from '../../components/techManager/techManagerUi';

/** Technical manager team create / edit forms (technical department only) */
export default function TechManagerTeamManage() {
  return (
    <div className="space-y-6">
      <TechManagerPageHeader
        icon={UsersRound}
        title="Team Management"
        subtitle="Create teams, add or remove members, and assign team leaders for the technical department."
      />
      <StaffRolesSettings departmentScope="technical" />
    </div>
  );
}
