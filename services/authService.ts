
import { supabase } from './supabaseClient';

const isSupabaseConfigured = () => {
  const url = (process.env as any).VITE_SUPABASE_URL;
  return url && !url.includes('your-project-url');
};

const MASTER_USER = {
  email: '12345678@gmail.com',
  password: '123456789',
  username: '12345678'
};

export const authService = {
  async getSession() {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
    }
    const localSession = localStorage.getItem('repairit_mock_session');
    return localSession ? JSON.parse(localSession) : null;
  },

  async signUp(username: string, password: string) {
    const internalEmail = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@repairit.app`;
    
    // Prevent registering the master account via standard signup if it already exists conceptually
    if (internalEmail === MASTER_USER.email) {
      throw new Error("This account is reserved. Please sign in instead.");
    }

    if (isSupabaseConfigured()) {
      return await supabase.auth.signUp({
        email: internalEmail,
        password,
        options: { data: { display_name: username } }
      });
    }

    // Mock Registration
    const users = JSON.parse(localStorage.getItem('repairit_mock_users') || '[]');
    if (users.find((u: any) => u.username === username || u.email === internalEmail)) {
      throw new Error("User already registered.");
    }
    
    const newUser = { id: crypto.randomUUID(), username, password, email: internalEmail };
    users.push(newUser);
    localStorage.setItem('repairit_mock_users', JSON.stringify(users));
    
    const session = { user: newUser, access_token: 'mock_token' };
    localStorage.setItem('repairit_mock_session', JSON.stringify(session));
    return { data: { session, user: newUser }, error: null };
  },

  async signIn(username: string, password: string) {
    const internalEmail = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@repairit.app`;

    // HARDCODED MASTER LOGIN CHECK
    if (internalEmail === MASTER_USER.email && password === MASTER_USER.password) {
      const user = { 
        id: 'master-user-id-000', 
        username: MASTER_USER.username, 
        email: MASTER_USER.email,
        is_master: true 
      };
      const session = { user, access_token: 'master_token' };
      localStorage.setItem('repairit_mock_session', JSON.stringify(session));
      return { data: { session, user }, error: null };
    }

    if (isSupabaseConfigured()) {
      try {
        const result = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });
        if (!result.error) return result;
      } catch (e) {
        // Fall through to mock if supabase fails
      }
    }

    // Standard Mock Login
    const users = JSON.parse(localStorage.getItem('repairit_mock_users') || '[]');
    const user = users.find((u: any) => (u.username === username || u.email === internalEmail) && u.password === password);
    
    if (!user) {
      throw new Error("Invalid login credentials.");
    }

    const session = { user, access_token: 'mock_token' };
    localStorage.setItem('repairit_mock_session', JSON.stringify(session));
    return { data: { session, user }, error: null };
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('repairit_mock_session');
  },

  onAuthStateChange(callback: (session: any) => void) {
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
      });
      return { data: { subscription: data.subscription } };
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};
