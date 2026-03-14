// ═══════════════════════════════════════════════════════════════
//  src/lib/AuthContext.jsx
//  Provides auth state (session + admin profile) to all components.
//  Replaces the hardcoded DEMO_USERS login in LoginPage.
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Supabase Auth user
  const [profile, setProfile] = useState(null);   // admin_profiles row
  const [loading, setLoading] = useState(true);

  // Load profile row from admin_profiles
  async function loadProfile(authUser) {
    if (!authUser) { setProfile(null); return; }
    const { data } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (data) {
      // Shape profile to match the existing user object shape the app expects:
      // { email, name, role, avatar }
      setProfile({
        id:     data.id,
        email:  authUser.email,
        name:   data.name,
        role:   data.role,
        avatar: data.avatar || data.name?.[0]?.toUpperCase() || "?",
      });
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        loadProfile(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
