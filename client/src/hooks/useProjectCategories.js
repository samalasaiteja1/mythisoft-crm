import { useState, useEffect } from 'react';
import { projectCategoriesAPI } from '../services/api';

export default function useActiveProjectCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectCategoriesAPI.getOptions()
      .then(({ data }) => setCategories(data.items || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const options = categories.map((c) => ({
    value: c._id,
    label: c.code ? `${c.name} (${c.code})` : c.name,
  }));

  return { categories, options, loading };
}

export const categoryLabel = (category) => {
  if (!category) return '—';
  if (typeof category === 'string') return category;
  return category.code ? `${category.name} (${category.code})` : category.name;
};
