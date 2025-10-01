import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Ajuste o caminho
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {

    const token = localStorage.getItem('sb-zshdgwiywzgzoobbyndl-auth-token');
    if (token) {
      const userSession = JSON.parse(token);
      setSession(userSession);
      const currentUser = userSession?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        getUserData(currentUser);
      }


    } else {
      setProfile(null);
      setSession(null);
      setUser(null);
      setLoading(false)
    }
  }, []);

  const getUserData = async (user) => {

    if (user) {
      setLoading(true);
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(userProfile);
      setIsAdmin(userProfile.role === 'admin');
      setLoading(false);
    } else {
      setLoading(false)
      setProfile(null);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}