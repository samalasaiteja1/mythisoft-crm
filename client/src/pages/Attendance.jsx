import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import EntityPage from '../components/EntityPage';
import { attendanceAPI, usersAPI, formatDate } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
];
const emptyForm = { user: '', date: '', status: 'present', checkIn: '09:00', checkOut: '18:00', notes: '' };

export default function Attendance() {
  const { canWrite } = usePermissions();
  const [userOptions, setUserOptions] = useState([]);

  useEffect(() => {
    usersAPI.getAll()
      .then(({ data }) => setUserOptions((Array.isArray(data) ? data : data.users || []).map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName}`,
      }))))
      .catch(() => {});
  }, []);

  const formFields = useMemo(() => [
    { name: 'user', label: 'Employee', type: 'select', options: userOptions, required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: 'checkIn', label: 'Check In' },
    { name: 'checkOut', label: 'Check Out' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ], [userOptions]);

  return (
    <EntityPage
      title="Attendance"
      subtitle="Track employee attendance and presence"
      icon={Clock}
      api={attendanceAPI}
      columns={[
        { key: 'user', label: 'Employee', render: (item) => item.user ? `${item.user.firstName} ${item.user.lastName}` : '-' },
        { key: 'date', label: 'Date', render: (item) => formatDate(item.date) },
        { key: 'status', label: 'Status', render: (item) => (item.status || '-').replace(/_/g, ' ') },
        { key: 'checkIn', label: 'Check In' },
        { key: 'checkOut', label: 'Check Out' },
      ]}
      formFields={formFields}
      emptyForm={emptyForm}
      statusOptions={statusOptions}
      statusKey="status"
      canCreate={canWrite('attendance')}
      canEdit={canWrite('attendance')}
      canDelete={canWrite('attendance')}
    />
  );
}
