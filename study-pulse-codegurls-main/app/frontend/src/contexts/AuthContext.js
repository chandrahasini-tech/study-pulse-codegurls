
Action: file_editor create /app/frontend/src/contexts/AuthContext.jsx --file-text "import { createContext, useContext, useEffect, useState } from \"react\";
import api, { formatApiErrorDetail } from \"../lib/api\";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = logged out, object = logged in
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get(\"/auth/me\");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post(\"/auth/login\", { email, password });
      setUser(data);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await api.post(\"/auth/register\", { email, password, name });
      setUser(data);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) };
    }
  };

  const logout = async () => {
    try {
      await api.post(\"/auth/logout\");
    } catch {}
    setUser(false);
  };

  const refreshUser = fetchMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
"
Observation: Create successful: /app/frontend/src/contexts/AuthContext.jsx
