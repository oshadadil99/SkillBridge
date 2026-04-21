import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../../components/admin/Sidebar";
import PageHeader from "../../components/admin/PageHeader";

const getPageTitle = (pathname) => {
  if (pathname === "/admin") {
    return "Dashboard";
  }

  if (pathname === "/admin/course") {
    return "Edit Courses ";
  }

  if (pathname === "/admin/course/new") {
    return "Add New Course";
  }

  if (pathname.startsWith("/admin/course/edit/")) {
    return "Edit Course";
  }

  return "Admin";
};

function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#D1E8FF] text-[#0B1957] font-sans">
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <Sidebar />

        <div className="flex-1">
          {location.pathname !== "/admin" && (
            <header className="sticky top-0 z-20 border-b border-[#9ECCFA] bg-[#F8F3EA]/95 backdrop-blur">
              <PageHeader label="Edit and manage all courses from one place." title={getPageTitle(location.pathname)} />
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

export default AdminLayout;
