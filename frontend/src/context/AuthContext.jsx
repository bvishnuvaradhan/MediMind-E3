import { createContext, useContext, useState, useEffect } from "react";
import { authApi, tokenStorage } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = tokenStorage.getToken();
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe(storedToken);
        if (isMounted && response?.data) {
          setUser(response.data);
          setToken(storedToken);
          tokenStorage.setUser(response.data);
        } else {
          tokenStorage.clearSession();
        }
      } catch {
        // Token invalid or expired
        tokenStorage.clearSession();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      tokenStorage.setToken(receivedToken);
      tokenStorage.setUser(receivedUser);

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (err) {
      const message = err.message || "Login failed. Please check your credentials.";
      setError(message);
      return { success: false, error: message };
    }
  };

  const signup = async ({ email, password }) => {
    setError(null);
    try {
      const response = await authApi.register({ email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      tokenStorage.setToken(receivedToken);
      tokenStorage.setUser(receivedUser);

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (err) {
      const message = err.message || "Registration failed.";
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    tokenStorage.clearSession();
    setUser(null);
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        signup,
        logout,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
