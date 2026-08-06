import { FileText } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { quotationsAPI, formatCurrency, QUOTATION_STATUSES } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const statusOptions = Object.entries(QUOTATION_STATUSES).map(([value, { label }]) => ({ value, label }));
const emptyForm = { title: '', total: 0, status: 'draft', notes: '' };
const formFields = [
  { name: 'title', label: 'Title' },
  { name: 'total', label: 'Total Amount', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function Quotations() {
  const { canWrite } = usePermissions();
  return (
    <EntityPage
      title="Quotations"
      subtitle="Create and manage sales quotations"
      icon={FileText}
      api={quotationsAPI}
      columns={[
        { key: 'quotationNumber', label: 'Quote #' },
        { key: 'title', label: 'Title' },
        { key: 'total', label: 'Total', render: (item) => formatCurrency(item.total) },
        { key: 'status', label: 'Status', statusMap: QUOTATION_STATUSES },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('quotations')}
      canEdit={canWrite('quotations')}
      canDelete={canWrite('quotations')}
    />
  );
}
