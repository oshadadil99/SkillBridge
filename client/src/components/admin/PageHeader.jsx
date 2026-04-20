import { useNavigate } from "react-router-dom";

import { clearSession } from "../../auth/session";

function PageHeader({ label = "LMS ADMINISTRATION", title }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-6 md:px-10">
      <div>
        <p className="text-xs tracking-widest uppercase text-[#6c7da7]">{label}</p>
        <h1 className="mb-4 mt-2 font-serif text-3xl font-bold text-[#112765]">{title}</h1>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#10246d] transition hover:border-[#10246d]"
      >
        Log Out
      </button>
    </div>
  );
}

export default PageHeader;
