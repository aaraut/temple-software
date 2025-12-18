import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomeRedirect() {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;

  if (auth.role === "SUPER_ADMIN" || auth.role === "ADMIN") {
    return <Navigate to="/gotra" replace />;
  }

  return <Navigate to="/gotra" replace />;
}
