import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import api from "../api/axios";
import { getStoredUser, isAuthenticated, updateStoredUser } from "../auth/session";
import CourseCard from "../components/CourseCard";

const CAREER_FOCUSED_CATEGORIES = [
  "Software Engineering",
  "Systems Engineering",
  "Information Technology",
  "Cyber Security",
  "Data Science"
];

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
  const [selectedCareerCategory, setSelectedCareerCategory] = useState("");
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

  const categoryCourseCounts = useMemo(() => {
    return CAREER_FOCUSED_CATEGORIES.reduce((accumulator, category) => {
      accumulator[category] = courses.filter(
        (course) => Number(course.price || 0) > 0 && String(course.category || "").trim() === category
      ).length;
      return accumulator;
    }, {});
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

  const filteredCareerCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      if (Number(course.price || 0) <= 0 || !selectedCareerCategory) {
        return false;
      }

      const title = String(course.title || "").toLowerCase();
      const category = String(course.category || "").trim();

      const matchesSelectedCareerCategory = category === selectedCareerCategory;
      const matchesSearch =
        !normalizedSearch || title.includes(normalizedSearch) || category.toLowerCase().includes(normalizedSearch);

      return matchesSelectedCareerCategory && matchesSearch;
    });
  }, [courses, searchTerm, selectedCareerCategory]);

  return (
    <main className="min-h-screen bg-[#F8F3EA] text-[#0B1957]">
      <header
        className={`sticky top-0 z-30 border-b border-[#9ECCFA] bg-[#F8F3EA]/95 backdrop-blur transition-all duration-300 ${
          isScrolled ? "shadow-[0_6px_24px_rgba(11,25,87,0.08)]" : ""
        }`}
      >
        <nav className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/home" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B1957] text-xs text-[#F8F3EA]">
              S
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">SkillBridge</span>
          </a>

          <div className="hidden items-center gap-9 text-xs font-semibold text-[#0B1957]/70 md:flex">
            <a href="/home" className="transition hover:text-[#0B1957]">Home</a>
            <a href="/home#about" className="transition hover:text-[#0B1957]">About Us</a>
            <a href="/course" className="text-[#0B1957]">Courses</a>
            <a href="/home#additional" className="transition hover:text-[#0B1957]">Additional Courses</a>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated() ? (
              <span className="hidden text-sm font-medium text-[#0B1957]/70 md:inline">
                {currentUserLabel}
              </span>
            ) : null}
            <a
              href={isAuthenticated() ? dashboardPath : "/login"}
              className="rounded-lg border border-[#9ECCFA] px-4 py-1.5 text-xs font-semibold text-[#0B1957] hover:border-[#0B1957] hover:bg-[#D1E8FF]"
            >
              {isAuthenticated() ? "Dashboard" : "Sign In"}
            </a>
          </div>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#9ECCFA] bg-[#D1E8FF] p-6 shadow-sm sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-1 text-xs font-semibold text-[#0B1957]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B1957]" />
            Course Catalog
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[#0B1957] sm:text-5xl">
            Available Courses
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#0B1957]/70">
            Browse the course catalog from the payment database and buy the courses you want to access.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title or category"
              className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm text-[#0B1957] outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA] md:col-span-4"
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-3 py-2 text-sm text-[#0B1957] outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA] md:col-span-1"
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
              className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-3 py-2 text-sm text-[#0B1957] outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA] md:col-span-1"
            >
              <option value="all">All Types</option>
              <option value="Course">Course</option>
              <option value="Additional Course">Additional Course</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#9ECCFA] bg-[#D1E8FF] p-10 text-center text-sm font-medium text-[#0B1957]/70 shadow-sm">
            Loading available courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#9ECCFA] bg-[#D1E8FF] p-10 text-center shadow-sm">
            <p className="text-base font-medium text-[#0B1957]">No courses found</p>
            <p className="mt-1 text-sm text-[#0B1957]/70">
              Try changing your search text or category filter.
            </p>
          </div>
        ) : (
          <>
            {(selectedType === "all" || selectedType === "Course") && (
              <section>
                <h2 className="mb-4 mt-6 text-2xl font-semibold text-[#0B1957]">Course</h2>
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

            {selectedType === "all" && <div className="my-10 border-t border-[#9ECCFA]" />}

            {(selectedType === "all" || selectedType === "Additional Course") && (
              <section className="space-y-6">
                <div className="flex flex-col gap-2">
                  <h2 className="mt-6 text-2xl font-semibold text-[#0B1957]">Career Focused Courses</h2>
                  <p className="max-w-3xl text-sm leading-6 text-[#0B1957]/70">
                    Choose a career pathway to explore the additional courses available for that specialization.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {CAREER_FOCUSED_CATEGORIES.map((category) => {
                    const isActive = selectedCareerCategory === category;
                    const courseCount = categoryCourseCounts[category] || 0;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setSelectedCareerCategory((currentCategory) =>
                            currentCategory === category ? "" : category
                          )
                        }
                        className={`group rounded-3xl border p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(11,25,87,0.12)] ${
                          isActive
                            ? "border-[#0B1957] bg-[#0B1957] text-[#F8F3EA]"
                            : "border-[#9ECCFA] bg-[#D1E8FF] text-[#0B1957] hover:border-[#0B1957]"
                        }`}
                      >
                        <div
                          className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-bold ${
                            isActive
                              ? "border-[#9ECCFA] bg-[#9ECCFA] text-[#0B1957]"
                              : "border-[#9ECCFA] bg-[#F8F3EA] text-[#0B1957]"
                          }`}
                        >
                          {category
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <h3 className="text-lg font-bold leading-6">{category}</h3>
                        <p className={`mt-3 text-sm ${isActive ? "text-[#D1E8FF]" : "text-[#0B1957]/70"}`}>
                          {courseCount} additional course{courseCount === 1 ? "" : "s"} available
                        </p>
                        <span
                          className={`mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.2em] ${
                            isActive ? "text-[#9ECCFA]" : "text-[#0B1957]/60"
                          }`}
                        >
                          {isActive ? "Selected" : "View Courses"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedCareerCategory ? (
                  filteredCareerCourses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-[#0B1957]">{selectedCareerCategory}</h3>
                          <p className="text-sm text-[#0B1957]/70">
                            Additional courses available in this focus area.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCareerCategory("")}
                          className="inline-flex items-center justify-center rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-2 text-sm font-semibold text-[#0B1957] transition hover:border-[#0B1957] hover:bg-[#D1E8FF]"
                        >
                          Clear Selection
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                        {filteredCareerCourses.map((course) => (
                          <CourseCard
                            key={course._id}
                            course={course}
                            isEnrolled={purchasedIds.includes(String(course._id))}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#9ECCFA] bg-[#D1E8FF] p-8 text-center shadow-sm">
                      <p className="text-base font-medium text-[#0B1957]">
                        No additional courses found for {selectedCareerCategory}.
                      </p>
                      <p className="mt-1 text-sm text-[#0B1957]/70">
                        Try another focus area or adjust your search text.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#9ECCFA] bg-[#D1E8FF] p-8 text-center shadow-sm">
                    <p className="text-base font-medium text-[#0B1957]">
                      Select a career focus area to view related additional courses.
                    </p>
                    <p className="mt-1 text-sm text-[#0B1957]/70">
                      The course list will appear here after you choose one of the five categories.
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Courses;
