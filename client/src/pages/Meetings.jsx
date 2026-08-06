import { useState, useEffect, useMemo } from 'react';
import { Video } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { meetingsAPI, customersAPI, leadsAPI, formatDateTime } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { ROLE_LABELS } from '../constants/permissions';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];
const emptyForm = { title: '', customer: '', lead: '', scheduledAt: '', type: 'call', status: 'scheduled', notes: '' };

const personLabel = (person) => {
  if (!person) return '-';
  if (typeof person === 'string') return person;
  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email || '-';
};

export default function Meetings() {
  const { canWrite, role } = usePermissions();
  const [customerOptions, setCustomerOptions] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]);

  useEffect(() => {
    customersAPI.getOptions()
      .then(({ data }) => setCustomerOptions(data.map((c) => ({ value: c._id, label: c.label }))))
      .catch(() => setCustomerOptions([]));
    if (role === 'sales' || role === 'admin' || role === 'manager') {
      leadsAPI.getOptions()
        .then(({ data }) => setLeadOptions(data.map((l) => ({ value: l._id, label: l.label }))))
        .catch(() => setLeadOptions([]));
    }
  }, [role]);

  const formFields = useMemo(() => {
    const fields = [
      { name: 'title', label: 'Meeting Title', required: true },
    ];
    if (customerOptions.length > 0 || role === 'admin' || role === 'manager') {
      fields.push({ name: 'customer', label: 'Customer', type: 'select', options: customerOptions });
    }
    if (leadOptions.length > 0) {
      fields.push({ name: 'lead', label: 'Lead', type: 'select', options: leadOptions });
    }
    fields.push(
      { name: 'scheduledAt', label: 'Date & Time', type: 'datetime-local', required: true },
      { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'call', label: 'Call' },
        { value: 'video', label: 'Video' },
        { value: 'in_person', label: 'In Person' },
      ]},
      { name: 'notes', label: 'Notes', type: 'textarea' },
    );
    return fields;
  }, [customerOptions, leadOptions, role]);

  const roleHint = {
    admin: 'All customers and leads',
    manager: 'All customers and leads',
    sales: 'Your assigned customers and leads',
  };

  return (
    <EntityPage
      title="Meetings"
      subtitle={`Schedule meetings · ${roleHint[role] || ROLE_LABELS[role] || ''}`}
      icon={Video}
      api={meetingsAPI}
      columns={[
        { key: 'title', label: 'Meeting' },
        { key: 'customer', label: 'Customer', render: (item) => personLabel(item.customer) },
        { key: 'lead', label: 'Lead', render: (item) => personLabel(item.lead) },
        { key: 'scheduledAt', label: 'Scheduled', render: (item) => formatDateTime(item.scheduledAt) },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      canCreate={canWrite('meetings')}
      canEdit={canWrite('meetings')}
      canDelete={canWrite('meetings')}
    />
  );
}
