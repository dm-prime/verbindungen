import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ADMIN_SESSION_KEY = "verbindungen_admin_session";

interface AdminSession {
  email: string;
}

interface AdminContextType {
  isAdmin: boolean;
  adminEmail: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const adminLoginMutation = useMutation(api.auth.adminLogin);

  // Verify the admin still exists
  const adminVerification = useQuery(
    api.auth.verifyAdmin,
    session ? { email: session.email } : "skip"
  );

  // Load session from storage on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const storedSession = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error("Failed to load admin session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  // If admin is no longer valid, clear session
  useEffect(() => {
    if (session && adminVerification === null) {
      logout();
    }
  }, [adminVerification, session]);

  const login = async (email: string, password: string) => {
    const result = await adminLoginMutation({ email, password });
    const newSession = { email: result.email };
    await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
    setSession(null);
  };

  const isAdmin = session !== null && adminVerification !== null;

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminEmail: session?.email ?? null,
        isLoading: isLoading || (session !== null && adminVerification === undefined),
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
