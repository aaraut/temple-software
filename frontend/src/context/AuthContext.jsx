import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();

const IDLE_TIMEOUT = 20 * 60 * 1000; // 10 minutes

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  });

  const idleTimer = useRef(null);

  const logout = () => {
    sessionStorage.clear();
    setAuth(null);
    window.location.href = "/login";
  };

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);

    idleTimer.current = setTimeout(() => {
      alert("Session expired due to inactivity");
      logout();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    if (!auth) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach(event =>
      window.addEventListener(event, resetIdleTimer)
    );

    resetIdleTimer();

    return () => {
      events.forEach(event =>
        window.removeEventListener(event, resetIdleTimer)
      );
      clearTimeout(idleTimer.current);
    };
  }, [auth]);

  const login = (data) => {
    sessionStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
