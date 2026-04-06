import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ROLE_HOME = { user: "/", driver: "/driver", admin: "/admin" };

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // If route requires a specific role and user's role doesn't match,
  // send them to their correct dashboard instead of a blank/wrong screen
  if (role && user.role !== role)
    return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  return children;
}
