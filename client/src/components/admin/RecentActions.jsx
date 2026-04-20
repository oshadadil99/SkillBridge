import React from "react";

const IconBook = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2V5Z" />
    <path d="M6 21h14" />
  </svg>
);

const IconUsers = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

const IconAward = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const IconFile = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export default function RecentActions() {
  const actions = [
    { title: 'New course "Advanced React" published', time: '2 hours ago', Icon: IconBook, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: '15 new learners enrolled today', time: '5 hours ago', Icon: IconUsers, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { title: 'Certificate issued to John Smith', time: '1 day ago', Icon: IconAward, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { title: 'Course "Web Design Basics" updated', time: '2 days ago', Icon: IconFile, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h2 className="text-lg font-bold text-[#1e2a4a] mb-6">Recent Actions</h2>

      <div className="divide-y divide-slate-100">
        {actions.map((action, idx) => (
          <div key={idx} className="py-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg ${action.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <action.Icon className={`${action.iconColor} h-5 w-5`} />
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900 mb-1">{action.title}</div>
              <div className="text-xs text-slate-500">{action.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
