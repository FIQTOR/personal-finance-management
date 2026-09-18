import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmailRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/signin', { replace: true });
  }, [navigate]);
  return null;
}
