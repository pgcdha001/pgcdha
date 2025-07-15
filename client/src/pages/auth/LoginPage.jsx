import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Eye, EyeOff, LogIn, AlertCircle, Mail, Lock } from 'lucide-react';
import logo from '../../../assets/logo.png';

// Add Sora font for headings
if (typeof document !== 'undefined') {
  const sora = document.createElement('link');
  sora.rel = 'stylesheet';
  sora.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Sora:wght@700&display=swap';
  document.head.appendChild(sora);
}

const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required').trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError, isAuthenticated } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      rememberMe: false
    }
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      clearErrors();
      clearError();
      const result = await login({
        login: data.login,
        password: data.password
      });
      if (result.success) {
        // Login successful, navigation handled by useEffect
      } else {
        if (result.error.includes('email') || result.error.includes('username')) {
          setError('login', { message: result.error });
        } else if (result.error.includes('password')) {
          setError('password', { message: result.error });
        } else {
          setError('root', { message: result.error });
        }
      }
    } catch {
      setError('root', { message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden font-sans">
      {/* Animated blurred gradient background shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-primary/70 via-accent/40 to-primary/90 blur-[120px] opacity-70 animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-accent/70 via-primary/40 to-accent/90 blur-[100px] opacity-60 animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-[80px] opacity-40 animate-float" />
      </div>
      {/* Glassmorphic card with fade-in and animated top bar */}
      <div className="relative z-10 w-full max-w-md mx-auto rounded-3xl bg-white/60 backdrop-blur-2xl shadow-2xl border border-border flex flex-col items-center px-10 py-14 animate-fade-in transition-shadow duration-300 hover:shadow-[0_20px_64px_0_rgba(26,35,126,0.18)] group" style={{boxShadow: '0 12px 48px 0 rgba(26,35,126,0.13)'}}>
        {/* Animated gradient bar at the top */}
        <span className="absolute top-0 left-8 right-8 h-1 rounded-b-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
        {/* Floating glass logo with glow and hover effect */}
        <div className="-mt-24 mb-6 flex items-center justify-center">
          <div className="rounded-full bg-white/60 backdrop-blur-xl shadow-lg border-2 border-primary p-2 flex items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl" style={{boxShadow: '0 0 0 8px rgba(26,35,126,0.08), 0 8px 32px 0 rgba(26,35,126,0.10)'}}>
            <img src={logo} alt="PGC Logo" className="w-20 h-20 rounded-full" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold mb-1 text-primary tracking-tight drop-shadow-sm font-[Sora,Inter,sans-serif]">Welcome Back</h1>
        <div className="w-full flex justify-center mb-8">
          <span className="text-sm text-primary/80 font-[Sora,Inter,sans-serif] max-w-full truncate cursor-help" title="Empowering your institute with next-gen management">Empowering your institute with next-gen management</span>
        </div>
        {/* Global error message */}
        {(error || errors.root) && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-lg w-full">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-accent mr-2" />
              <span className="text-accent text-sm">
                {error || errors.root?.message}
              </span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
          {/* Login field (email or username) */}
          <div className="relative">
            <label htmlFor="login" className="block text-sm font-semibold text-foreground mb-2 font-[Inter,sans-serif]">
              Email or Username
            </label>
            <span className="absolute left-3 top-10 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" id="login-icon">
              <Mail className="h-5 w-5" />
            </span>
            <input
              {...register('login')}
              type="text"
              id="login"
              className={`input w-full bg-white/80 shadow-inner focus:shadow-lg focus:bg-white pl-10 font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none ${errors.login ? 'border-accent' : ''}`}
              placeholder="Enter your email or username"
              autoComplete="username"
              onFocus={e => e.target.previousSibling.classList.add('text-primary')}
              onBlur={e => e.target.previousSibling.classList.remove('text-primary')}
            />
            {errors.login && (
              <p className="mt-1 text-sm text-accent">{errors.login.message}</p>
            )}
          </div>
          {/* Password field */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2 font-[Inter,sans-serif]">
              Password
            </label>
            <span className="absolute left-3 top-10 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" id="password-icon">
              <Lock className="h-5 w-5" />
            </span>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`input w-full pr-12 pl-10 bg-white/80 shadow-inner focus:shadow-lg focus:bg-white font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none ${errors.password ? 'border-accent' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                onFocus={e => e.target.parentNode.previousSibling.classList.add('text-primary')}
                onBlur={e => e.target.parentNode.previousSibling.classList.remove('text-primary')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-accent">{errors.password.message}</p>
            )}
          </div>
          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded shadow-sm"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-muted-foreground font-[Inter,sans-serif]">
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-accent font-semibold transition-colors font-[Inter,sans-serif]"
            >
              Forgot password?
            </Link>
          </div>
          {/* Submit button with animated gradient border */}
          <div className="relative">
            <span className="absolute inset-0 rounded-xl p-[2px] bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x blur-sm opacity-70 pointer-events-none" />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-lg rounded-xl shadow-lg bg-gradient-to-r from-primary to-accent text-white font-bold hover:from-accent hover:to-primary hover:scale-[1.04] active:scale-100 transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:outline-none animate-float-btn border-none relative z-10"
              style={{boxShadow: '0 6px 32px 0 rgba(26,35,126,0.13)'}}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </>
              )}
            </Button>
          </div>
        </form>
        {/* Help text */}
        <div className="mt-6 text-center w-full">
          <p className="text-xs text-muted-foreground font-[Inter,sans-serif]">
            Having trouble? Contact your system administrator for help.
          </p>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-24px) scale(1.04); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(18px) scale(1.02); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(32px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.9s cubic-bezier(.4,0,.2,1) 0.1s both; }
        .animate-float-btn { animation: float 3.5s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;
