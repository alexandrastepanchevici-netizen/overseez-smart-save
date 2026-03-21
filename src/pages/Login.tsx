import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoImg from '@/assets/overseez-logo.png';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('All fields are required'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(err.message);
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <img src={logoImg} alt="Overseez" className="w-12 h-12 mx-auto mb-3 invert" />
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Log in to continue saving smarter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="mt-1 bg-muted/50 border-border" />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" className="mt-1 bg-muted/50 border-border" />
          </div>

          {error && <p className="text-sm text-overseez-red bg-overseez-red/10 rounded-lg p-3">{error}</p>}

          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-overseez-blue hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
