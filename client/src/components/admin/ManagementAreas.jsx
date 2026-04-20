import React from "react";

export default function ManagementAreas() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
      <h2 className="text-lg font-bold text-[#1e2a4a] mb-6">Management Areas</h2>

      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4 py-1">
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">User Management</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Oversee learner accounts, permissions, and enrollment status across
            all courses.
          </p>
        </div>

        <div className="border-l-4 border-purple-500 pl-4 py-1">
          <h3 className="text-sm font-bold text-slate-900 mb-1.5">Course Oversight</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Manage course content, track completion rates, and ensure quality
            standards are met.
          </p>
        </div>
      </div>
    </div>
  );
}
