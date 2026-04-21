import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import { clearSession, getStoredUser, isAuthenticated, updateStoredUser } from "../auth/session";
import CourseCard from "../components/CourseCard";

function User() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncDashboard = async () => {
      if (!isAuthenticated()) {
        setUser(null);
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [meResponse, coursesResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/catalog/my-courses")
        ]);

        const currentUser = meResponse.data?.data || null;
        const enrolledCourses = Array.isArray(coursesResponse.data?.data) ? coursesResponse.data.data : [];

        if (currentUser) {
          updateStoredUser(currentUser);
          setUser(currentUser);
        }

        setCourses(enrolledCourses);
      } catch {
        clearSession();
        setUser(null);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    syncDashboard();

    const handleAuthChanged = () => {
      const storedUser = getStoredUser();
      setUser(storedUser);
    };

    window.addEventListener("authChanged", handleAuthChanged);
    return () => window.removeEventListener("authChanged", handleAuthChanged);
  }, []);

  const freeCourses = useMemo(
    () => courses.filter((course) => Number(course.price || 0) === 0),
    [courses]
  );
  const paidCourses = useMemo(
    () => courses.filter((course) => Number(course.price || 0) > 0),
    [courses]
  );

  const handleDisenroll = async (courseId) => {
    const selectedCourse = courses.find((course) => String(course._id) === String(courseId));
    const courseTitle = selectedCourse?.title || "this course";

    if (!window.confirm(`Disenroll from "${courseTitle}"?`)) {
      return;
    }

    try {
      await api.delete(`/catalog/courses/${courseId}/enrollment`);
      const meResponse = await api.get("/auth/me");
      const currentUser = meResponse.data?.data || null;

      if (currentUser) {
        updateStoredUser(currentUser);
        setUser(currentUser);
      }

      setCourses((currentCourses) =>
        currentCourses.filter((course) => String(course._id) !== String(courseId))
      );
    } catch (error) {
      alert(error.message || "Failed to disenroll from this course");
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-10 text-center shadow-sm">
          <p className="text-base font-medium text-[#1c2f6f]">You need to sign in first.</p>
          <p className="mt-1 text-sm text-[#6c7da7]">Log in to view your enrolled courses.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              to="/login?redirect=/user"
              className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d327f]"
            >
              Sign In
            </Link>
            <Link
              to="/course"
              className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#10246d] hover:border-[#10246d]"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7da7]">User Dashboard</p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#112765]">My Enrolled Courses</h1>
          <p className="mt-2 text-sm text-[#6c7da7]">
            Signed in as {user?.email || "user"}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-10 text-center text-sm font-medium text-[#6c7da7] shadow-sm">
          Loading your enrolled courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-10 text-center shadow-sm">
          <p className="text-base font-medium text-[#1c2f6f]">You are not enrolled in any courses yet.</p>
          <p className="mt-1 text-sm text-[#6c7da7]">Visit the catalog to enroll in a course.</p>
          <div className="mt-4">
            <Link
              to="/course"
              className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d327f]"
            >
              View Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#112765]">Free Courses</h2>
              <Link
                to="/course?type=Course"
                className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#10246d] hover:border-[#10246d]"
              >
                Explore Courses
              </Link>
            </div>

            {freeCourses.length > 0 ? (
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {freeCourses.map((course) => (
                  <CourseCard key={course._id} course={course} isEnrolled onRemove={handleDisenroll} />
                ))}
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-6 text-sm text-[#6c7da7]">
                No free courses enrolled yet.
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#112765]">Paid Courses</h2>
              <Link
                to="/course?type=Additional%20Course"
                className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-2 text-sm font-semibold text-[#10246d] hover:border-[#10246d]"
              >
                Explore Additional Courses
              </Link>
            </div>

            {paidCourses.length > 0 ? (
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paidCourses.map((course) => (
                  <CourseCard key={course._id} course={course} isEnrolled onRemove={handleDisenroll} />
                ))}
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-6 text-sm text-[#6c7da7]">
                No paid courses enrolled yet.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default User;
