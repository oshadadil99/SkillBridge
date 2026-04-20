import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import api from "../api/axios";
import { getStoredUser, isAuthenticated, updateStoredUser } from "../auth/session";
import CourseCard from "../components/CourseCard";

function Courses() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("type") || "all";
    } catch {
      return "all";
    }
  });
  const [purchasedIds, setPurchasedIds] = useState(() => {
    const user = getStoredUser();
    return Array.isArray(user?.purchasedCourses) ? user.purchasedCourses.map(String) : [];
  });
  const currentUser = getStoredUser();
  const currentUserLabel = currentUser?.name || currentUser?.email || "Signed In";
  const dashboardPath = currentUser?.role === "admin" ? "/admin" : "/user";

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      setSelectedType(params.get("type") || "all");
    } catch {
      setSelectedType("all");
    }
  }, [location.search]);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);

      try {
        const response = await api.get("/catalog/courses");
        const catalogCourses = Array.isArray(response.data?.data) ? response.data.data : [];
        setCourses(catalogCourses);
      } catch (requestError) {
        alert(requestError.message || "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    const syncCurrentUser = async () => {
      if (!isAuthenticated()) {
        setPurchasedIds([]);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const user = response.data?.data;

        if (user) {
          updateStoredUser(user);
          setPurchasedIds(
            Array.isArray(user.purchasedCourses) ? user.purchasedCourses.map(String) : []
          );
        }
      } catch {
        setPurchasedIds([]);
      }
    };

    syncCurrentUser();

    const handleAuthChanged = () => {
      const user = getStoredUser();
      setPurchasedIds(Array.isArray(user?.purchasedCourses) ? user.purchasedCourses.map(String) : []);
    };

    window.addEventListener("authChanged", handleAuthChanged);
    return () => window.removeEventListener("authChanged", handleAuthChanged);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(
      courses
        .map((course) => String(course.category || "").trim())
        .filter(Boolean)
    );

    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const title = String(course.title || "").toLowerCase();
      const category = String(course.category || "").toLowerCase();
      const courseType = Number(course.price || 0) === 0 ? "Course" : "Additional Course";

      const matchesSearch =
        !normalizedSearch || title.includes(normalizedSearch) || category.includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "all"
        || String(course.category || "").toLowerCase() === selectedCategory.toLowerCase();

      const matchesType = selectedType === "all" || courseType === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [courses, searchTerm, selectedCategory, selectedType]);

  return (
    <main className="min-h-screen bg-[#f6f2ea] text-[#0d2165]">
      <header
        className={`sticky top-0 z-30 border-b border-[#d8d2c5] bg-[#f6f2ea]/95 backdrop-blur transition-all duration-300 ${
          isScrolled ? "shadow-[0_6px_24px_rgba(11,25,87,0.08)]" : ""
        }`}
      >
        <nav className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/home" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10246d] text-xs text-white">
              âŒ‚
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">SkillBridge</span>
          </a>

          <div className="hidden items-center gap-9 text-xs font-semibold text-[#5e6f9a] md:flex">
            <a href="/home" className="transition hover:text-[#10246d]">Home</a>
            <a href="/home#about" className="transition hover:text-[#10246d]">About Us</a>
            <a href="/course" className="text-[#10246d]">Courses</a>
            <a href="/home#additional" className="transition hover:text-[#10246d]">Additional Courses</a>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated() ? (
              <span className="hidden text-sm font-medium text-[#5e6f9a] md:inline">
                {currentUserLabel}
              </span>
            ) : null}
            <a
              href={isAuthenticated() ? dashboardPath : "/login"}
              className="rounded-lg border border-[#c8c4ba] px-4 py-1.5 text-xs font-semibold text-[#10246d] hover:border-[#10246d]"
            >
              {isAuthenticated() ? "Dashboard" : "Sign In"}
            </a>
          </div>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#d7d2c7] bg-[#f8f5ef] p-6 shadow-sm sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#c9c5bb] bg-[#ece8df] px-4 py-1 text-xs font-semibold text-[#10246d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f8450]" />
            Course Catalog
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[#112765] sm:text-5xl">
            Available Courses
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6c7da7]">
            Browse the course catalog from the payment database and buy the courses you want to access.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title or category"
              className="w-full rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-4 py-3 text-sm text-[#0d2165] outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20 md:col-span-4"
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-3 py-2 text-sm text-[#0d2165] outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20 md:col-span-1"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="w-full rounded-xl border border-[#c8c4ba] bg-[#fffdfa] px-3 py-2 text-sm text-[#0d2165] outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20 md:col-span-1"
            >
              <option value="all">All Types</option>
              <option value="Course">Course</option>
              <option value="Additional Course">Additional Course</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#d7d2c7] bg-[#fffdfa] p-10 text-center text-sm font-medium text-[#6c7da7] shadow-sm">
            Loading available courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c8c4ba] bg-[#fffdfa] p-10 text-center shadow-sm">
            <p className="text-base font-medium text-[#1c2f6f]">No courses found</p>
            <p className="mt-1 text-sm text-[#6c7da7]">
              Try changing your search text or category filter.
            </p>
          </div>
        ) : (
          <>
            {(selectedType === "all" || selectedType === "Course") && (
              <section>
                <h2 className="mb-4 mt-6 text-2xl font-semibold text-[#112765]">Course</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {filteredCourses
                    .filter((course) => Number(course.price || 0) === 0)
                    .map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        isEnrolled={purchasedIds.includes(String(course._id))}
                      />
                    ))}
                </div>
              </section>
            )}

            {selectedType === "all" && <div className="my-10 border-t border-[#e7e3da]" />}

            {(selectedType === "all" || selectedType === "Additional Course") && (
              <section>
                <h2 className="mb-4 mt-6 text-2xl font-semibold text-[#112765]">Additional Course</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {filteredCourses
                    .filter((course) => Number(course.price || 0) > 0)
                    .map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        isEnrolled={purchasedIds.includes(String(course._id))}
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Courses;
