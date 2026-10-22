
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Pages that admins should not access (member-only pages)
const MEMBER_ONLY_PATHS = ["/membership", "/my-membership"];

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f8f3]">
        <p className="font-medium text-emerald-800">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Redirect admins away from member-only pages
  if (user.role === "ADMIN") {
    if (MEMBER_ONLY_PATHS.includes(location.pathname)) {
      return <Navigate to="/admin" replace />;
    }
    // Admin can still access /dashboard and /golf-scores
  }

  return <Outlet />;
}
