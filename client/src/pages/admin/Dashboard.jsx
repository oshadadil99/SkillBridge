import { useEffect, useState } from "react";

import api from "../../api/axios";
import StatCard from "../../components/admin/StatCard";
import StatsCards from "../../components/admin/StatsCards";
import ManagementAreas from "../../components/admin/ManagementAreas";
import RecentActions from "../../components/admin/RecentActions";

const CourseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2V5Z" />
    <path d="M6 21h14" />
  </svg>
);

const StudentIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const PublishedIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const DraftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </svg>
);

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);

      try {
        const coursesResponse = await api.get("/courses");

        const courses = Array.isArray(coursesResponse.data?.data)
          ? coursesResponse.data.data
          : [];

        setCourseCount(courses.length);

        const publishedCourses = courses.filter(
          (course) => String(course?.status || "").toLowerCase() === "published"
        ).length;

        setPublishedCount(publishedCourses);
        setDraftCount(Math.max(courses.length - publishedCourses, 0));

        // Enrollment count endpoint is not implemented yet; default to 0.
        setStudentCount(0);
      } catch {
        setCourseCount(0);
        setStudentCount(0);
        setPublishedCount(0);
        setDraftCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-10 text-center text-sm font-medium text-[#6c7da7] shadow-sm">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1e2a4a] mb-2">Platform oversight at a glance</h1>
        <p className="text-slate-500 text-sm">
          Monitor your learning platform's key metrics and recent activities in real-time.
        </p>
      </div>

      {/* Stats Row */}
      <StatsCards
        courseCount={courseCount}
        studentCount={studentCount}
        publishedCount={publishedCount}
        draftCount={draftCount}
      />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManagementAreas />
        <RecentActions />
      </div>
    </div>
  );
}

export default Dashboard;
