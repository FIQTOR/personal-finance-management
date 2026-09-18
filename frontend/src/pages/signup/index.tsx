import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/setup', { replace: true });
  }, [navigate]);
  return null;
}
