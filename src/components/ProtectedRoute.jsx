import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ROLE_HOME = { user: "/", driver: "/driver", admin: "/admin" };

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Only enforce role redirect if user.role is a known valid role
  if (role && user.role && user.role !== role)
    return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  return children;
}
