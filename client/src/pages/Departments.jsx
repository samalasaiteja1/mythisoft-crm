import EntityPage from '../components/EntityPage';
import { departmentsAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { Building2 } from 'lucide-react';

const emptyForm = { name: '', description: '' };
const formFields = [
  { name: 'name', label: 'Department Name' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Departments() {
  const { canWrite } = usePermissions();
  return (
    <EntityPage
      title="Departments"
      subtitle="Manage company departments"
      icon={Building2}
      api={departmentsAPI}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      canCreate={canWrite('departments')}
      canEdit={canWrite('departments')}
      canDelete={canWrite('departments')}
    />
  );
}
