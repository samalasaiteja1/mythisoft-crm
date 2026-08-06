import { Receipt } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { expensesAPI, formatCurrency } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];
const emptyForm = { title: '', amount: 0, category: 'other', status: 'pending', description: '' };
const formFields = [
  { name: 'title', label: 'Title' },
  { name: 'amount', label: 'Amount', type: 'number' },
  { name: 'category', label: 'Category', type: 'select', options: [
    { value: 'salary', label: 'Salary' },
    { value: 'office', label: 'Office' },
    { value: 'travel', label: 'Travel' },
    { value: 'software', label: 'Software' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'tax', label: 'Tax' },
    { value: 'other', label: 'Other' },
  ]},
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Expenses() {
  const { canWrite } = usePermissions();
  return (
    <EntityPage
      title="Expenses"
      subtitle="Track business expenses and approvals"
      icon={Receipt}
      api={expensesAPI}
      columns={[
        { key: 'title', label: 'Expense' },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount', render: (item) => formatCurrency(item.amount) },
        { key: 'status', label: 'Status' },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('expenses')}
      canEdit={canWrite('expenses')}
      canDelete={canWrite('expenses')}
    />
  );
}
