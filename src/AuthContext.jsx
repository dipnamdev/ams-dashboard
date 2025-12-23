import { createContext, useEffect, useState } from "react";
import { getCurrentUser, getMe } from "./services/auth";

export const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const userFromStorage = await getCurrentUser();
      setUser(userFromStorage);
      if (userFromStorage) {
        try {
          await getMe();
        } catch (error) {
          // Error handled by api interceptor
        }
      }
    })();

    const handler = async (e) => {
      setUser(e.detail); // updated user
    };

    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
