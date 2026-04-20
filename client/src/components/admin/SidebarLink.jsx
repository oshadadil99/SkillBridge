import { NavLink } from "react-router-dom";

function SidebarLink(props) {
  const { to, end = false, label } = props;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-[#10246d] text-white shadow-sm"
            : "border border-[#e6e0d4] bg-white text-[#5e6f9a] hover:border-[#c8c4ba] hover:text-[#10246d]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isActive ? "bg-white/20" : "bg-white"
            }`}
          >
            <props.Icon className="h-5 w-5" />
          </div>

          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default SidebarLink;
