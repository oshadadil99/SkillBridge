function StatCard({ title, value, icon, accent = "indigo" }) {
  const accentClassMap = {
    indigo: "from-[#10246d] to-[#1d327f]",
    blue: "from-[#23408f] to-[#2d54b8]",
    emerald: "from-emerald-500 to-green-500",
    amber: "from-amber-400 to-orange-500"
  };

  return (
    <article className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[#6c7da7]">{title}</p>
          <p className="text-3xl font-semibold text-[#112765]">{value}</p>
        </div>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${accentClassMap[accent]}`}>
          {icon}
        </div>
      </div>
    </article>
  );
}

export default StatCard;
