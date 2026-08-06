import { useState } from 'react';
import { emptyDealForm } from '../utils/dealForm';

export function useDealForm(initial = emptyDealForm) {
  const [form, setForm] = useState(initial);

  const setDeal = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setProject = (patch) => setForm((prev) => ({
    ...prev,
    projectRequirements: { ...prev.projectRequirements, ...patch },
  }));

  return {
    form,
    setForm,
    setDeal,
    setProject,
  };
}
