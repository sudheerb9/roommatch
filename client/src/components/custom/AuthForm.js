import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '../ui/button';

const AuthForm = ({ onLoginClick }) => {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    setPending(true);
    // Simulate login
    setTimeout(() => {
      onLoginClick();
      setPending(false);
    }, 1000);
  };

  return (
    <div className="w-full">
      <form className="w-full">
        <Button
          onClick={handleClick}
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
      </form>
    </div>
  );
};

export default AuthForm;
