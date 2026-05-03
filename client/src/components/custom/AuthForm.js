import { GoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { setBearerToken } from '../../utils/api';
import { Button } from '../ui/button';

const AuthForm = ({ onLoginClick }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const googleLoginRef = useRef(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setPending(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.message || 'Google sign in failed');
        return;
      }

      window.localStorage.setItem('roommatch_bearer_token', data.token);
      setBearerToken(data.token);
      navigate('/profile');
    } catch (err) {
      setError('Unable to connect to the server.');
    } finally {
      setPending(false);
    }
  };

  const handleButtonClick = () => {
    if (googleLoginRef.current) {
      googleLoginRef.current.querySelector('div[role="button"]')?.click();
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-[#b91c1c] mb-4">{error}</p>}

        <div ref={googleLoginRef} className="hidden">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign in failed. Please try again.')}
          />
        </div>

        <Button
          type="button"
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#100e06] border border-[#881c1c] h-12 rounded-xl text-base font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#881c1c]" />
          ) : (
            <FcGoogle className="w-6 h-6" />
          )}
          {pending ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
