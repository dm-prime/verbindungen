import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const AUTH_TOKEN_KEY = "verbindungen_auth_token";

interface User {
  _id: Id<"users">;
  authToken: string;
  email?: string;
  createdAt: number;
}

interface UserContextType {
  user: User | null;
  userId: Id<"users"> | null;
  isLoading: boolean;
  linkEmail: (email: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const createAnonymousUser = useMutation(api.auth.createAnonymousUser);
  const linkEmailMutation = useMutation(api.auth.linkEmail);
  const loginWithEmailMutation = useMutation(api.auth.loginWithEmail);

  // Query user with the current auth token
  const user = useQuery(
    api.auth.getUser,
    authToken ? { authToken } : "skip"
  );

  // Load auth token from storage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadAuthToken() {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          setAuthToken(storedToken);
          setIsLoading(false);
        } else {
          // Create anonymous user
          const result = await createAnonymousUser();
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.authToken);
          setAuthToken(result.authToken);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load auth token:", error);
        setIsLoading(false);
      }
    }

    loadAuthToken();
  }, [createAnonymousUser]);

  const linkEmail = async (email: string) => {
    if (!authToken) {
      throw new Error("Not authenticated");
    }
    await linkEmailMutation({ authToken, email });
  };

  const loginWithEmail = async (email: string) => {
    const result = await loginWithEmailMutation({ email });
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.authToken);
    setAuthToken(result.authToken);
  };

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        userId: user?._id ?? null,
        isLoading: isLoading || (authToken !== null && user === undefined),
        linkEmail,
        loginWithEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
