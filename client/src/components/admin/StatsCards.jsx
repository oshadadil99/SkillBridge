import React from "react";

const IconUsers = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

const IconBook = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2V5Z" />
    <path d="M6 21h14" />
  </svg>
);

const IconAward = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconClock = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5l3 3" />
  </svg>
);

export default function StatsCards({ courseCount, studentCount, publishedCount, draftCount }) {
  const format = (v) => (typeof v === "number" ? new Intl.NumberFormat().format(v) : v || "–");

  const stats = [
    { title: "Total Learners", value: format(studentCount), Icon: IconUsers, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { title: "Active Courses", value: format(courseCount), Icon: IconBook, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { title: "Certificates Issued", value: format(publishedCount), Icon: IconAward, iconBg: "bg-green-100", iconColor: "text-green-600" },
    { title: "Pending Reviews", value: format(draftCount), Icon: IconClock, iconBg: "bg-orange-100", iconColor: "text-orange-600" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.Icon;
        return (
          <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center mb-4`}>
              <Icon className={`${stat.iconColor} h-6 w-6`} />
            </div>

            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.title}</div>
          </div>
        );
      })}
    </div>
  );
}
