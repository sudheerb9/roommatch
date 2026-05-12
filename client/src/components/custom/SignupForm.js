// Reusable UI component for the SignupForm interface element.
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

const SignupForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      // Registration immediately returns an auth token for post-signup onboarding.
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          display_name: name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.message || 'Signup failed');
        return;
      }

      // Persist token for existing flows that still read roommatch_token.
      window.localStorage.setItem('roommatch_token', data.token);
      onSuccess?.(data);
    } catch (err) {
      setError('Unable to connect to the server.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full">
      <form className="w-full" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-[#100e06] mb-2">
          Full Name
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          type="text"
          placeholder="Your full name"
          className="w-full mb-4 px-4 py-3 rounded-2xl border border-[#e5e7eb] focus:border-[#881c1c] focus:outline-none focus:ring-2 focus:ring-[#881c1c]/20"
        />

        <label className="block text-sm font-semibold text-[#100e06] mb-2">
          Email
        </label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="you@example.com"
          className="w-full mb-4 px-4 py-3 rounded-2xl border border-[#e5e7eb] focus:border-[#881c1c] focus:outline-none focus:ring-2 focus:ring-[#881c1c]/20"
        />

        <label className="block text-sm font-semibold text-[#100e06] mb-2">
          Password
        </label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          placeholder="Create a password"
          className="w-full mb-6 px-4 py-3 rounded-2xl border border-[#e5e7eb] focus:border-[#881c1c] focus:outline-none focus:ring-2 focus:ring-[#881c1c]/20"
        />

        {error && <p className="text-sm text-[#b91c1c] mb-4">{error}</p>}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#881c1c] text-white font-bold shadow-lg shadow-[#881c1c]/20 transition-transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={pending}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Signing up...
            </span>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </div>
  );
};

export default SignupForm;
