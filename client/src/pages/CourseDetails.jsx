import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api, { UPLOADS_BASE_URL } from "../api/axios";
import { getStoredUser, isAuthenticated, updateStoredUser } from "../auth/session";
import CourseToolsPanel from "../components/CourseToolsPanel";

const resolveAssetUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (/^www\./i.test(raw)) {
    return `https://${raw}`;
  }

  if (raw.startsWith("/uploads/")) {
    return `${UPLOADS_BASE_URL}${raw.replace(/^\/uploads/, "")}`;
  }

  if (raw.startsWith("uploads/")) {
    return `${UPLOADS_BASE_URL}/${raw.replace(/^uploads\//, "")}`;
  }

  return raw;
};

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    billingEmail: ""
  });
  const [paymentError, setPaymentError] = useState("");
  const [purchasedIds, setPurchasedIds] = useState(() => {
    const user = getStoredUser();
    return Array.isArray(user?.purchasedCourses) ? user.purchasedCourses.map(String) : [];
  });

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/catalog/courses/${id}`);
        const courseData = response.data?.data || null;

        setCourse(courseData);

        setModules([]);
      } catch (error) {
        alert(error.message || "Failed to load course details");
        setCourse(null);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

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
          setPurchasedIds(Array.isArray(user.purchasedCourses) ? user.purchasedCourses.map(String) : []);
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
    const fetchProtectedContent = async () => {
      const storedUser = getStoredUser();
      const hasAccess = purchasedIds.includes(String(id)) || storedUser?.role === "admin";

      if (!isAuthenticated() || !hasAccess) {
        setModules([]);
        return;
      }

      try {
        const response = await api.get(`/catalog/courses/${id}/content`);
        const modulesData = Array.isArray(response.data?.data?.modules)
          ? response.data.data.modules
          : [];
        setModules(modulesData);
      } catch {
        setModules([]);
      }
    };

    fetchProtectedContent();
  }, [id, purchasedIds]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const summary = useMemo(() => {
    const lessonCount = modules.reduce(
      (sum, moduleItem) => sum + (Array.isArray(moduleItem.lessons) ? moduleItem.lessons.length : 0),
      0
    );

    return {
      moduleCount: modules.length,
      lessonCount
    };
  }, [modules]);

  const formattedPrice = useMemo(() => {
    const numericPrice = Number(course?.price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return "Free";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(numericPrice);
  }, [course?.price]);

  const currentUser = getStoredUser();
  const currentUserLabel = currentUser?.name || currentUser?.email || "Signed In";
  const isPurchased = purchasedIds.includes(String(id));
  const showProtectedContent = isPurchased || currentUser?.role === "admin";
  const dashboardPath = currentUser?.role === "admin" ? "/admin" : "/user";
  const isPaidCourse = Number(course?.price || 0) > 0;

  useEffect(() => {
    setPaymentForm((prev) => ({
      ...prev,
      billingEmail: currentUser?.email || prev.billingEmail
    }));
  }, [currentUser?.email]);

  const handleBuyCourse = async () => {
    if (!isAuthenticated()) {
      navigate(`/login?redirect=${encodeURIComponent(`/course/${id}`)}`);
      return;
    }

    try {
      setPurchasing(true);
      const response = await api.post(`/catalog/courses/${id}/purchase`);
      const currentUserResponse = await api.get("/auth/me");
      const user = currentUserResponse.data?.data;

      if (user) {
        updateStoredUser(user);
        setPurchasedIds(Array.isArray(user.purchasedCourses) ? user.purchasedCourses.map(String) : []);
      } else {
        const purchasedCourses = Array.isArray(response.data?.data?.purchasedCourses)
          ? response.data.data.purchasedCourses
          : [];
        setPurchasedIds(purchasedCourses.map(String));
      }
    } catch (error) {
      alert(error.message || "Failed to buy this course");
    } finally {
      setPurchasing(false);
    }
  };

  const handlePaymentInputChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setPaymentError("");
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    const requiredValues = [
      paymentForm.cardholderName,
      paymentForm.cardNumber,
      paymentForm.expiryDate,
      paymentForm.cvv,
      paymentForm.billingEmail
    ];

    if (requiredValues.some((value) => !String(value || "").trim())) {
      setPaymentError("Complete the temporary payment form before buying this additional course.");
      return;
    }

    await handleBuyCourse();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F3EA] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-[#9ECCFA] bg-[#D1E8FF] p-10 text-center text-sm font-medium text-[#0B1957]/70 shadow-sm">
          Loading course details...
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-[#F8F3EA] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-6xl space-y-4 rounded-2xl border border-[#9ECCFA] bg-[#D1E8FF] p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#0B1957]">Course not found</p>
          <Link
            to="/course"
            className="inline-flex items-center justify-center rounded-xl bg-[#0B1957] px-5 py-2.5 text-sm font-semibold text-[#F8F3EA] hover:bg-[#9ECCFA] hover:text-[#0B1957]"
          >
            Back to Course Catalog
          </Link>
        </div>
      </main>
    );
  }

  const thumbnail = resolveAssetUrl(course.thumbnail);

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
              âŒ‚
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
        <div className="flex items-center justify-between">
          <Link
            to="/course"
            className="inline-flex items-center justify-center rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-2 text-sm font-semibold text-[#0B1957] transition hover:border-[#0B1957] hover:bg-[#D1E8FF]"
          >
            Back to Courses
          </Link>

          <span className="inline-flex rounded-full bg-[#D1E8FF] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B1957]">
            {course.status || "published"}
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#9ECCFA] bg-[#F8F3EA] shadow-sm">
          {thumbnail ? (
            <img
              src={encodeURI(thumbnail)}
              alt={`${course.title} thumbnail`}
              className="h-60 w-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-60 items-center justify-center bg-[#0B1957] text-sm font-semibold text-[#F8F3EA]">
              No Thumbnail
            </div>
          )}

          <div className="mt-6 flex items-center justify-end px-2 md:px-8">
            {showProtectedContent ? (
              <>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-xl bg-[#9ECCFA] px-4 py-2 text-sm font-semibold text-[#0B1957]"
                >
                  Purchased
                </button>

                <Link
                  to={dashboardPath}
                className="ml-3 inline-flex items-center justify-center rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-3 py-2 text-sm font-semibold text-[#0B1957] hover:border-[#0B1957] hover:bg-[#D1E8FF]"
                >
                  View My Courses
                </Link>
              </>
            ) : isPaidCourse ? (
              <a
                href="#payment-section"
                className="inline-flex items-center justify-center rounded-xl bg-[#0B1957] px-4 py-2 text-sm font-semibold text-[#F8F3EA] hover:bg-[#9ECCFA] hover:text-[#0B1957]"
              >
                Open Payment Section
              </a>
            ) : (
              <button
                type="button"
                onClick={handleBuyCourse}
                disabled={purchasing}
                className="inline-flex items-center justify-center rounded-xl bg-[#0B1957] px-4 py-2 text-sm font-semibold text-[#F8F3EA] hover:bg-[#9ECCFA] hover:text-[#0B1957] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {purchasing ? "Processing..." : (Number(course.price || 0) > 0 ? "Buy Course" : "Get Access")}
              </button>
            )}
          </div>

          <div className="space-y-4 p-6 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1957]/70">Course Details</p>
              <h1 className="mt-2 font-serif text-4xl font-bold leading-tight text-[#0B1957]">{course.title}</h1>
              <p className="mt-2 text-sm leading-7 text-[#0B1957]/70">{course.description || "No description available."}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[#9ECCFA] bg-[#D1E8FF] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B1957]">
                {course.category || "Uncategorized"}
              </span>
              <span className="inline-flex rounded-full bg-[#D1E8FF] px-2.5 py-1 text-xs font-semibold text-[#0B1957]">
                Price: {formattedPrice}
              </span>
              <span className="inline-flex rounded-full bg-[#D1E8FF] px-2.5 py-1 text-xs font-semibold text-[#0B1957]">
                {summary.moduleCount} Modules
              </span>
              <span className="inline-flex rounded-full bg-[#D1E8FF] px-2.5 py-1 text-xs font-semibold text-[#0B1957]">
                {summary.lessonCount} Lessons
              </span>
            </div>
          </div>
        </section>

        {!showProtectedContent && isPaidCourse ? (
          <section
            id="payment-section"
            className="rounded-2xl border border-[#9ECCFA] bg-[#F8F3EA] p-6 shadow-sm md:p-8"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B1957]/70">
                  Temporary Payment Section
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#0B1957]">
                  Payment Details
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#0B1957]/70">
                  This is a temporary placeholder payment form until the full payment
                  gateway is implemented by another developer. Users must pass through
                  this section before buying an additional course.
                </p>
              </div>

              <div className="rounded-xl bg-[#D1E8FF] px-4 py-3 text-sm font-semibold text-[#0B1957]">
                Amount: {formattedPrice}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="cardholderName" className="text-sm font-medium text-[#0B1957]">
                    Cardholder Name
                  </label>
                  <input
                    id="cardholderName"
                    name="cardholderName"
                    type="text"
                    value={paymentForm.cardholderName}
                    onChange={handlePaymentInputChange}
                    placeholder="Enter cardholder name"
                    className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="billingEmail" className="text-sm font-medium text-[#0B1957]">
                    Billing Email
                  </label>
                  <input
                    id="billingEmail"
                    name="billingEmail"
                    type="email"
                    value={paymentForm.billingEmail}
                    onChange={handlePaymentInputChange}
                    placeholder="Enter billing email"
                    className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                <div className="space-y-2">
                  <label htmlFor="cardNumber" className="text-sm font-medium text-[#0B1957]">
                    Card Number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={handlePaymentInputChange}
                    placeholder="0000 0000 0000 0000"
                    className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="expiryDate" className="text-sm font-medium text-[#0B1957]">
                    Expiry
                  </label>
                  <input
                    id="expiryDate"
                    name="expiryDate"
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={handlePaymentInputChange}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cvv" className="text-sm font-medium text-[#0B1957]">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    name="cvv"
                    type="password"
                    value={paymentForm.cvv}
                    onChange={handlePaymentInputChange}
                    placeholder="123"
                    className="w-full rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-4 py-3 text-sm outline-none transition focus:border-[#0B1957] focus:ring-2 focus:ring-[#9ECCFA]"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-[#9ECCFA] bg-[#D1E8FF] p-4 text-sm text-[#0B1957]/70">
                Payment gateway integration is not connected yet. This form is a temporary
                UI step only and will be replaced by the dedicated payment implementation.
              </div>

              {paymentError ? (
                <p className="text-sm font-medium text-[#0B1957]">{paymentError}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={purchasing}
                  className="inline-flex items-center justify-center rounded-xl bg-[#0B1957] px-5 py-2.5 text-sm font-semibold text-[#F8F3EA] transition hover:bg-[#9ECCFA] hover:text-[#0B1957] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {purchasing ? "Processing..." : "Confirm Payment & Buy Course"}
                </button>

                <Link
                  to="/course"
                  className="inline-flex items-center justify-center rounded-xl border border-[#9ECCFA] bg-[#F8F3EA] px-5 py-2.5 text-sm font-semibold text-[#0B1957] transition hover:border-[#0B1957] hover:bg-[#D1E8FF]"
                >
                  Back to Catalog
                </Link>
              </div>
            </form>
          </section>
        ) : null}

        <div className={`grid gap-6 ${showProtectedContent ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
          <section className="space-y-4 rounded-2xl border border-[#9ECCFA] bg-[#F8F3EA] p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-[#0B1957]">Course Content</h2>

            {!showProtectedContent ? (
              <div className="rounded-xl border border-dashed border-[#9ECCFA] p-5 text-sm text-[#0B1957]/70">
                Log in and buy this course before accessing the full content.
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#9ECCFA] p-4 text-sm text-[#0B1957]/70">
                No module content has been linked to this purchased course yet.
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((moduleItem, moduleIndex) => (
                  <article key={moduleItem._id} className="rounded-xl border border-[#9ECCFA] bg-[#D1E8FF] p-4">
                    <h3 className="text-lg font-semibold text-[#0B1957]">
                      Module {moduleIndex + 1}: {moduleItem.title}
                    </h3>

                    {String(moduleItem.content || "").trim() ? (
                      <p className="mt-2 whitespace-pre-line break-words text-sm text-[#0B1957]/70">
                        {moduleItem.content}
                      </p>
                    ) : null}

                    <div className="mt-3 space-y-2">
                      {Array.isArray(moduleItem.lessons) && moduleItem.lessons.length > 0 ? (
                        moduleItem.lessons.map((lessonItem, lessonIndex) => (
                          <div
                            key={lessonItem._id}
                            className="rounded-lg border border-[#9ECCFA] bg-[#F8F3EA] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="pl-3 text-sm font-semibold text-[#0B1957]">
                                Lesson {lessonIndex + 1}: {lessonItem.title}
                              </p>
                              <span className="rounded-full bg-[#D1E8FF] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#0B1957]">
                                {lessonItem.contentType || "text"}
                              </span>
                            </div>

                            {String(lessonItem.content || "").trim() ? (
                              <p className="mt-2 whitespace-pre-line break-words text-xs text-[#0B1957]/70">
                                {lessonItem.content}
                              </p>
                            ) : null}

                            {String(lessonItem.fileUrl || "").trim() ? (
                              <a
                                href={encodeURI(resolveAssetUrl(lessonItem.fileUrl))}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-xs font-semibold text-[#0B1957] underline underline-offset-2 hover:text-[#0B1957]/70"
                              >
                                Open lesson file
                              </a>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#0B1957]/70">No lessons in this module yet.</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {showProtectedContent ? <CourseToolsPanel /> : null}
        </div>
      </div>
    </main>
  );
}

export default CourseDetails;
