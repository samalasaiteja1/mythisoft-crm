import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { dealsAPI, usersAPI } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import {
  ASSIGN_DROPDOWN_COPY,
  getAssignManagerSelectValue,
  getAssignSalesSelectValue,
  salesOptionsForAssignee,
  enrichAssignedRecord,
  filterActiveSalesUsers,
  formatAssigneeName,
  leadHasManager,
  leadHasExecutive,
} from '../../constants/adminLeadViews';

export default function DealAssignModal({ deal, isOpen, onClose, onAssigned }) {
  const { isAdmin, isManager } = usePermissions();
  const { user } = useAuth();
  const [salesUsers, setSalesUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [assignedManager, setAssignedManager] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        if (isAdmin) {
          const { data } = await usersAPI.getManagers();
          setManagers(Array.isArray(data) ? data : []);
        }
        const { data: allUsers } = await usersAPI.getAll();
        const sales = filterActiveSalesUsers(allUsers);
        if (isManager) {
          setSalesUsers(sales.filter((u) => String(u.reportsTo?._id || u.reportsTo) === String(user._id)));
        } else {
          setSalesUsers(sales);
        }
      } catch {
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, [isOpen, isAdmin, isManager, user]);

  useEffect(() => {
    if (!deal) return;
    setAssignedManager(getAssignManagerSelectValue(deal));
    setAssignedTo(getAssignSalesSelectValue(deal));
  }, [deal]);

  const salesOptions = useMemo(
    () => salesOptionsForAssignee({ assignedManager }, salesUsers),
    [assignedManager, salesUsers],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deal?._id) return;
    if (!assignedManager && !assignedTo) {
      toast.error('Select a manager or sales executive');
      return;
    }
    setSubmitting(true);
    try {
      let updated = deal;
      if (isAdmin && assignedManager && assignedManager !== getAssignManagerSelectValue(deal)) {
        const { data } = await dealsAPI.update(deal._id, { assignedManager });
        updated = enrichAssignedRecord({ ...updated, ...data }, { managers, salesUsers });
      }
      if (assignedTo && assignedTo !== getAssignSalesSelectValue(deal)) {
        const { data } = await dealsAPI.assign(deal._id, { assignedTo });
        updated = enrichAssignedRecord({ ...updated, ...data }, { managers, salesUsers });
      }
      toast.success('Deal assignment updated');
      onAssigned?.(updated);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !deal) return null;

  const isAssignedDeal = leadHasManager(deal) || leadHasExecutive(deal);
  const managerPlaceholder = isAssignedDeal ? ASSIGN_DROPDOWN_COPY.changeManager : ASSIGN_DROPDOWN_COPY.selectManager;
  const salesPlaceholder = isAssignedDeal ? ASSIGN_DROPDOWN_COPY.changePerson : ASSIGN_DROPDOWN_COPY.selectSales;

  return (
    <Modal isOpen onClose={onClose} title={`Assign: ${deal.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAdmin && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isAssignedDeal ? ASSIGN_DROPDOWN_COPY.changeManager : ASSIGN_DROPDOWN_COPY.assignManager}
            </label>
            <select
              className="input-field w-full"
              value={assignedManager}
              onChange={(e) => setAssignedManager(e.target.value)}
            >
              <option value="">{managerPlaceholder}</option>
              {managers.map((u) => (
                <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {isAssignedDeal ? ASSIGN_DROPDOWN_COPY.changePerson : ASSIGN_DROPDOWN_COPY.assignSales}
          </label>
          <select
            className="input-field w-full"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={!salesOptions.length}
          >
            <option value="">{salesPlaceholder}</option>
            {salesOptions.map((u) => (
              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : 'Save assignment'}</button>
        </div>
      </form>
    </Modal>
  );
}
