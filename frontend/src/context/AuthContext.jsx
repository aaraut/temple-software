import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();

const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 minutes

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  });

  // Language persisted in sessionStorage, defaults to Hindi
  const [language, setLanguageState] = useState(() => {
    return sessionStorage.getItem("appLanguage") || "hi";
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

  // login now accepts a preferred language chosen at login screen
  const login = (data, preferredLanguage = "hi") => {
    sessionStorage.setItem("auth", JSON.stringify(data));
    sessionStorage.setItem("appLanguage", preferredLanguage);
    setAuth(data);
    setLanguageState(preferredLanguage);
  };

  // setLanguage can be called from any component (e.g. header toggle)
  const setLanguage = (lang) => {
    sessionStorage.setItem("appLanguage", lang);
    setLanguageState(lang);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, language, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
