import { CreditCard } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { paymentsAPI, formatCurrency } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];
const emptyForm = { amount: 0, method: 'bank_transfer', status: 'pending', transactionId: '' };
const formFields = [
  { name: 'amount', label: 'Amount', type: 'number' },
  { name: 'method', label: 'Method', type: 'select', options: [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
  ]},
  { name: 'transactionId', label: 'Transaction ID' },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
];

export default function Payments() {
  const { canWrite } = usePermissions();
  return (
    <EntityPage
      title="Payments"
      subtitle="Track customer payments and transactions"
      icon={CreditCard}
      api={paymentsAPI}
      columns={[
        { key: 'paymentNumber', label: 'Payment #' },
        { key: 'amount', label: 'Amount', render: (item) => formatCurrency(item.amount) },
        { key: 'method', label: 'Method', render: (item) => (item.method || '-').replace(/_/g, ' ') },
        { key: 'status', label: 'Status' },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('payments')}
      canEdit={canWrite('payments')}
      canDelete={canWrite('payments')}
    />
  );
}
