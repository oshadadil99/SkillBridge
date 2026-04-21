import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { clearSession, getStoredUser } from "../../auth/session";

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconPencil = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 21v-3l11-11 3 3L6 21H3z" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function Sidebar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    const handleAuthChanged = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener("authChanged", handleAuthChanged);
    return () => window.removeEventListener("authChanged", handleAuthChanged);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const displayName = currentUser?.name || "Admin User";
  const displayEmail = currentUser?.email || "admin@skillbridge.com";

  return (
    <div className="w-64 sticky top-0 h-screen bg-[#0B1957] text-white flex flex-col flex-shrink-0 hidden md:flex z-30">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F8F3EA] text-[#0B1957] font-bold rounded flex items-center justify-center text-lg">S</div>
        <span className="font-bold tracking-wider text-sm">SKILLBRIDGE</span>
      </div>

      {/* User Profile */}
      <div className="px-4 mb-6">
        <div className="bg-[#D1E8FF]/16 rounded-lg border border-[#9ECCFA]/30 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#9ECCFA]/25 flex items-center justify-center flex-shrink-0">
            <IconUser />
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm truncate">{displayName}</div>
            <div className="text-xs text-[#D1E8FF] truncate">{displayEmail}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-[#9ECCFA]/50 bg-transparent px-3 py-2 text-sm font-medium text-[#F8F3EA] transition hover:bg-[#D1E8FF]/16 hover:text-white"
        >
          Log Out
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive ? "bg-[#9ECCFA] text-[#0B1957]" : "text-[#D1E8FF] hover:bg-[#D1E8FF]/16 hover:text-white"
            } px-3 py-2.5 rounded-lg text-sm font-medium transition-colors`
          }
        >
          <IconDashboard />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/admin/course/new"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive ? "bg-[#9ECCFA] text-[#0B1957]" : "text-[#D1E8FF] hover:bg-[#D1E8FF]/16 hover:text-white"
            } px-3 py-2.5 rounded-lg text-sm font-medium transition-colors`
          }
        >
          <IconPlus />
          <span>Create Course</span>
        </NavLink>

        <NavLink
          to="/admin/course"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive ? "bg-[#9ECCFA] text-[#0B1957]" : "text-[#D1E8FF] hover:bg-[#D1E8FF]/16 hover:text-white"
            } px-3 py-2.5 rounded-lg text-sm font-medium transition-colors`
          }
        >
          <IconPencil />
          <span>Edit Course</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;
