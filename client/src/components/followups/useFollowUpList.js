import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { followupsAPI } from '../../services/api';

export function useFollowUpList(queryParams = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const paramKey = JSON.stringify(queryParams);

  const refresh = useCallback(() => {
    setLoading(true);
    return followupsAPI.getAll(queryParams)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error('Failed to load follow-ups'))
      .finally(() => setLoading(false));
  }, [paramKey]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, refresh, setItems };
}

export function useFollowUpStats() {
  const [stats, setStats] = useState({
    pending: 0, today: 0, overdue: 0, overdueDeals: 0,
    leadStage: 0, dealStage: 0, allDeals: 0, customerStage: 0, allCustomers: 0,
    assignedLeadFollowUps: 0, unassignedLeadFollowUps: 0,
  });
  const location = useLocation();

  useEffect(() => {
    followupsAPI.getStats().then(({ data }) => setStats(data)).catch(() => {});
  }, [location.pathname]);

  return stats;
}
