import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getStoredUser, isAuthenticated } from "../auth/session";
import UserSidebar from "../components/UserSidebar";
import PageHeader from "../components/admin/PageHeader";

const getPageTitle = (pathname) => {
  if (pathname === "/user") return "My Enrolled Courses";
  if (pathname.startsWith("/user/word-to-pdf")) return "PDF → Word";
  if (pathname.startsWith("/user/compress-size")) return "Compress Size";
  return "User";
};

function UserLayout() {
  const location = useLocation();
  const currentUser = getStoredUser();

  if (!isAuthenticated()) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (currentUser?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#D1E8FF] text-[#0B1957] font-sans">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <UserSidebar />

        <div className="flex-1">
          {location.pathname !== "/user" && (
            <header className="sticky top-0 z-20 border-b border-[#9ECCFA] bg-[#F8F3EA]/95 backdrop-blur">
              <PageHeader label="User Tools" title={getPageTitle(location.pathname)} />
            </header>
          )}

          <main className="p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default UserLayout;
