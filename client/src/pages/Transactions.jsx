import { ArrowLeftRight } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { paymentsAPI, formatCurrency, formatDateTime } from '../services/api';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export default function Transactions() {
  return (
    <EntityPage
      title="Transactions"
      subtitle="All payment transactions — bank transfers, UPI, card, and refunds"
      icon={ArrowLeftRight}
      api={paymentsAPI}
      columns={[
        { key: 'paymentNumber', label: 'Transaction #' },
        { key: 'amount', label: 'Amount', render: (item) => formatCurrency(item.amount) },
        { key: 'method', label: 'Method', render: (item) => (item.method || '-').replace(/_/g, ' ') },
        { key: 'status', label: 'Status' },
        { key: 'paidAt', label: 'Date', render: (item) => formatDateTime(item.paidAt || item.createdAt) },
      ]}
      formFields={[]}
      emptyForm={{}}
      statusOptions={statusOptions}
      canCreate={false}
      canEdit={false}
      canDelete={false}
    />
  );
}
