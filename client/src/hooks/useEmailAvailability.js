import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function useEmailAvailability(email) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef();

  useEffect(() => {
    const value = String(email || '').trim().toLowerCase();
    clearTimeout(timerRef.current);

    if (!value || !EMAIL_RE.test(value)) {
      setStatus(null);
      setChecking(false);
      return undefined;
    }

    setChecking(true);
    timerRef.current = setTimeout(() => {
      usersAPI.checkEmail(value)
        .then(({ data }) => setStatus(data))
        .catch(() => setStatus(null))
        .finally(() => setChecking(false));
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [email]);

  return { status, checking };
}
