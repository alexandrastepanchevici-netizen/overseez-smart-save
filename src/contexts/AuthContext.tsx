import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getRedirectUrl } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  subscribed: boolean;
  subscriptionEnd: string | null;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  nickname: string;
  birth_date: string;
  total_saved: number;
  weekly_saved: number;
  monthly_saved: number;
  currency: string;
  xp: number;
  current_streak: number;
  longest_streak: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      setProfile(data as unknown as Profile);

      // Auto-create bi-directional friendship when a referred user first loads
      const referredBy = (data as any).referred_by as string | null;
      if (referredBy) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('nickname', referredBy)
          .single();

        if (referrerProfile?.user_id && referrerProfile.user_id !== userId) {
          // Insert both directions; unique constraint silently ignores duplicates
          await supabase.from('friendships').upsert(
            [
              { user_id: userId, friend_id: referrerProfile.user_id },
              { user_id: referrerProfile.user_id, friend_id: userId },
            ] as any,
            { onConflict: 'user_id,friend_id', ignoreDuplicates: true }
          );
        }
      }
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setSubscribed(data.subscribed || false);
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
        setTimeout(() => checkSubscription(), 100);
      } else {
        setProfile(null);
        setSubscribed(false);
        setSubscriptionEnd(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkSubscription();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo: getRedirectUrl() },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscribed(false);
    setSubscriptionEnd(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, subscribed, subscriptionEnd, signUp, signIn, signOut, refreshProfile, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
