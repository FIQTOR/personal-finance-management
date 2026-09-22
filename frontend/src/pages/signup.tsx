import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Self-registration is disabled (setup-only). Redirect to the sign-in page.
 */
export default function SignupRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/signin', { replace: true });
  }, [navigate]);
  return null;
}
