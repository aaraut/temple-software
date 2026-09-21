import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isModuleVisible } from "../constants/modules";
import ModuleNotAvailable from "../pages/ModuleNotAvailable";

export default function ProtectedRoute({ children, roles, moduleKey }) {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // Force password change before accessing any other page
  if (auth.forcePasswordChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(auth.role)) {
    return <Navigate to="/" replace />;
  }

  if (moduleKey && !isModuleVisible(auth, moduleKey)) {
    return <ModuleNotAvailable />;
  }

  return children;
}
