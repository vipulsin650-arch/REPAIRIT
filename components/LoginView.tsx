
import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginViewProps {
  onLogin: (session: any) => void;
  onSkip: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSkip }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (isRegistering) {
        result = await authService.signUp(username, password);
      } else {
        result = await authService.signIn(username, password);
      }
      
      if (result.error) throw result.error;
      
      if (result.data?.session) {
        onLogin(result.data.session);
      } else {
        setSuccessMsg("Check your account or try logging in now!");
        setIsRegistering(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim().length >= 3 && 
                      password.length >= 6 && 
                      (!isRegistering || (isRegistering && confirmPassword.length >= 6));

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-30"></div>

      <button onClick={onSkip} className="absolute top-8 right-8 px-5 py-2 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-95 transition-all group z-10">
        <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">Skip to Guest</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <div className="flex items-center mb-2 scale-110">
          <span className="font-[900] text-4xl text-black tracking-tighter uppercase leading-none">REPAIR</span>
          <span className="font-[900] text-4xl text-blue-600 tracking-tighter uppercase leading-none ml-1 blur-[1px]">IT</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">India's Reliable Doorstep Repair</p>

        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{isRegistering ? 'Register' : 'Login'}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{isRegistering ? 'Create your repair profile' : 'Welcome back, Bhaiya!'}</p>
          </div>

          {(error || successMsg) && (
            <div className={`${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} p-4 rounded-2xl text-[10px] font-black uppercase tracking-tight text-center border ${error ? 'border-red-100' : 'border-green-100'} animate-slide-up`}>
              {error || successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-white outline-none transition-all shadow-sm text-slate-900" />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-white outline-none transition-all shadow-sm text-slate-900" />
            </div>

            {isRegistering && (
              <div className="relative animate-slide-up group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-white outline-none transition-all shadow-sm text-slate-900" />
              </div>
            )}
          </div>

          <button type="submit" disabled={!isFormValid || isLoading} className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isFormValid && !isLoading ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : isRegistering ? 'Start My Journey' : 'Sign In'}
          </button>

          <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest px-4 leading-relaxed pt-4">
            {isRegistering ? 'Existing member?' : "New around here?"} 
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} className="text-blue-600 font-black ml-2 hover:underline decoration-2 underline-offset-4">
              {isRegistering ? 'Log In' : 'Join Now'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
