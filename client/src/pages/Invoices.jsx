import EntityPage from '../components/EntityPage';
import { FileText } from 'lucide-react';
import { invoicesAPI, formatCurrency, INVOICE_STATUSES } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const statusOptions = Object.entries(INVOICE_STATUSES).map(([value, { label }]) => ({ value, label }));
const emptyForm = { total: 0, status: 'draft', notes: '' };
const formFields = [
  { name: 'total', label: 'Total Amount', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function Invoices() {
  const { canWrite } = usePermissions();
  return (
    <EntityPage
      icon={FileText}
      title="Invoices"
      subtitle="Generate and track customer invoices"
      api={invoicesAPI}
      columns={[
        { key: 'invoiceNumber', label: 'Invoice #' },
        { key: 'total', label: 'Amount', render: (item) => formatCurrency(item.total) },
        { key: 'amountPaid', label: 'Paid', render: (item) => formatCurrency(item.amountPaid) },
        { key: 'status', label: 'Status', statusMap: INVOICE_STATUSES },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('invoices')}
      canEdit={canWrite('invoices')}
      canDelete={canWrite('invoices')}
    />
  );
}
