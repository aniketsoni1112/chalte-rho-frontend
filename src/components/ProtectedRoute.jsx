import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ROLE_HOME = {
  user:    "/",
  driver:  "/driver",
  admin:   "/admin",
  manager: "/manager",
};

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext);

  // Show spinner while checking auth — prevents flash redirect on refresh
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  // Role-specific route guard — allow array of roles or single role
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role))
      return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  }

  return children;
}
