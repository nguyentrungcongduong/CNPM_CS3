import { Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  if (!user || !user.role || !user.role.code) {
    return <Navigate to="/403" replace />;
  }

  const userRole = user.role.code;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}