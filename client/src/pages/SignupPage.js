// Page-level container for SignupPage view state and user interactions.
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/custom/SignupForm';

function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden w-screen left-[calc(-50vw+50%)]">
      <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-[#881c1c]/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vh] h-[40vh] bg-[#7a0019]/5 rounded-full blur-[80px]" />

      <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative z-10">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold text-[#100e06] leading-tight mb-6">
            Join RoomMatch and <span className="text-[#881c1c]">build</span>{' '}
            your best living situation.
          </h1>
          <p className="text-lg text-[#100e06]/70 leading-relaxed">
            Create your account, share your preferences, and discover compatible
            roommates in minutes.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10 bg-white/30 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none h-screen sm:h-auto lg:h-screen">
        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-[#100e06]/60 hover:text-[#881c1c] transition-colors mb-8 group font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          <div className="bg-white backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-[#881c1c]/20 ring-1 ring-[#881c1c]/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7a0019] via-[#881c1c] to-[#7a0019]" />

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#100e06] mb-2 tracking-tight">
                Create your account
              </h2>
              <p className="text-[#100e06]/60 text-sm">
                Sign up to start matching with roommates.
              </p>
            </div>

            <SignupForm onSuccess={() => navigate('/profile')} />
          </div>

          <div className="mt-8 pt-6 border-t border-[#100e06]/5 text-center">
            <p className="text-xs text-[#100e06]/40 leading-relaxed">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium underline text-[#881c1c] hover:text-[#7a0019]"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
