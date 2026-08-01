import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (userData: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredAuth(): { user: any | null; token: string | null } {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      return { user: JSON.parse(storedUser), token: storedToken };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { user: null, token: null };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initial = readStoredAuth();
  const [user, setUser] = useState<any | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);
  // Session is read synchronously — never block first paint on auth boot
  const [loading] = useState(false);

  const login = (userData: any) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
