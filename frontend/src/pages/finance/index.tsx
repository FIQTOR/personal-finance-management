import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FinanceRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/panel/finance', { replace: true });
  }, [navigate]);

  return null;
}
