import { Navigate, useLocation } from "react-router-dom";

import { getStoredUser, isAuthenticated } from "../auth/session";

function RequireRole({ allowedRoles = [], children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const user = getStoredUser();

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/course" replace />;
  }

  return children;
}

export default RequireRole;
