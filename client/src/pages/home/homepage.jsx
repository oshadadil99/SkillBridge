import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Home", href: "/home" },
  { label: "About Us", href: "#about" },
  { label: "Courses", href: "/course" },
  { label: "Additional Courses", href: "#additional" },
];

const topStats = [
  { value: "12K+", label: "Active Students" },
  { value: "180+", label: "Expert Courses" },
  { value: "96%", label: "Satisfaction Rate" },
];

const featuredCourses = [
  { icon: "🤖", title: "Machine Learning", meta: "Dr. S. Perera • 48 hrs", price: "$149" },
  { icon: "💻", title: "Full Stack Dev", meta: "Ravi Kumar • 36 hrs", price: "$99" },
  { icon: "📊", title: "Data Analytics", meta: "D. Wickrama • 28 hrs", price: "$89" },
];

const highlights = [
  {
    title: "Practical Course Paths",
    text: "Learn from structured tracks designed by industry mentors.",
  },
  {
    title: "Project-Based Learning",
    text: "Build portfolio projects while progressing through each module.",
  },
  {
    title: "Career-Focused Outcomes",
    text: "Prepare for internships and job roles with guided assessments.",
  },
];

const Homepage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal], [data-stagger]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <main className="min-h-screen bg-[#f6f2ea] text-[#0d2165]">
      <header
        className={`sticky top-0 z-30 border-b border-[#d8d2c5] bg-[#f6f2ea]/95 backdrop-blur transition-all duration-300 ${
          isScrolled ? "shadow-[0_6px_24px_rgba(11,25,87,0.08)]" : ""
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10246d] text-xs text-white">
              ⌂
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">SkillBridge</span>
          </div>

          <ul className="hidden items-center gap-9 text-xs font-semibold text-[#5e6f9a] md:flex">
            {navItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="transition hover:text-[#10246d]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg border border-[#c8c4ba] px-4 py-1.5 text-xs font-semibold text-[#10246d] hover:border-[#10246d]"
            >
              Sign In
            </Link>
            <Link
              to="/course"
              className="rounded-lg bg-[#10246d] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1d327f]"
            >
              Get Started →
            </Link>
          </div>
        </nav>
      </header>

      <section id="hero" className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1280px] grid-cols-1 lg:grid-cols-2">
        <div className="px-6 pb-14 pt-12 sm:px-10 lg:px-12 lg:pt-20">
          <div data-reveal className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c9c5bb] bg-[#ece8df] px-4 py-1 text-xs font-semibold text-[#10246d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1f8450]" />
            Trusted by 12,000+ Students in Sri Lanka
          </div>

          <h1 data-reveal className="max-w-xl text-5xl font-bold leading-[1.04] text-[#112765] sm:text-6xl">
            <span className="font-serif">Bridge Your Skills,</span>
            <br />
            <em className="font-serif font-semibold not-italic text-[#1e3276]">Shape Your Future</em>
          </h1>

          <p data-reveal className="mt-7 max-w-lg text-lg leading-8 text-[#6c7da7]">
            SkillBridge is your all-in-one learning platform. Expert-led courses,
            flexible schedules, and verified certificates that employers actually
            recognize all in one place.
          </p>

          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <a
              href="/course"
              className="rounded-xl bg-[#10246d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d327f]"
            >
              Start Learning →
            </a>
            <a
              href="/course"
              className="rounded-xl border border-[#c8c4ba] bg-[#f6f2ea] px-6 py-3 text-sm font-semibold text-[#10246d] transition hover:border-[#10246d]"
            >
              ▶ Watch Demo
            </a>
          </div>

          <div data-reveal className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {topStats.map((item) => (
              <div key={item.label} className="border-r border-[#ddd5c8] pr-2 last:border-r-0">
                <p className="text-4xl font-bold leading-none text-[#10246d]">{item.value}</p>
                <p className="text-xs font-medium text-[#7382a8]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden bg-[#10246d] px-6 py-8 sm:px-10 lg:px-8">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#2a3f90]/85" />
          <div className="absolute -bottom-20 right-[-20px] h-56 w-56 rounded-full bg-[#1d327f]/75" />
          <div className="absolute right-10 top-10 h-20 w-28 bg-[radial-gradient(#4a63b0_1px,transparent_1px)] [background-size:10px_10px] opacity-40" />

          <div className="relative mx-auto mt-24 max-w-[420px] space-y-5">
            <div className="float-a rounded-2xl bg-white p-5 shadow-2xl">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7c89ad]">
                Your Learning Path
              </p>
              <div className="space-y-2.5">
                {featuredCourses.map((course) => (
                  <div
                    key={course.title}
                    className="flex items-center gap-3 border-b border-[#eef1f7] pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eef3ff] text-sm">
                      {course.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#10246d]">{course.title}</p>
                      <p className="text-[11px] text-[#8390b1]">{course.meta}</p>
                    </div>
                    <p className="ml-auto text-sm font-bold text-[#10246d]">{course.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="float-b ml-[-20px] max-w-[300px] rounded-2xl bg-white p-4 shadow-2xl">
              <p className="text-[11px] font-semibold text-[#8390b1]">Currently Learning</p>
              <p className="mt-1 text-sm font-bold text-[#10246d]">Advanced Machine Learning</p>
              <div className="mt-2 h-2 rounded-full bg-[#e5eaf8]">
                <div className="h-2 w-[68%] rounded-full bg-[#10246d]" />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#10246d]">68% Complete</p>
            </div>

            <div className="float-c ml-auto max-w-[220px] rounded-xl bg-white px-4 py-3 shadow-2xl">
              <p className="text-xs font-bold text-[#10246d]">🏆 Certificate Earned!</p>
              <p className="text-[11px] text-[#8390b1]">Web Development Pro</p>
            </div>

            <div className="absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full border border-[#4560ad]/50" />
          </div>
        </div>

        <a href="#highlights" className="scroll-indicator hidden lg:flex">
          <span>Scroll</span>
          <div className="scroll-mouse" />
        </a>
      </section>

      <section id="highlights" className="mx-auto max-w-[1280px] px-6 pb-16 sm:px-8 lg:px-10">
        <div data-stagger className="stagger-group grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="stagger-item rounded-2xl border border-[#d7d2c7] bg-[#f8f5ef] p-6 shadow-sm"
            >
              <h2 className="text-3xl font-bold text-[#112765]">{item.title}</h2>
              <p className="mt-4 text-lg leading-8 text-[#5f719e]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>

      <style>{`
        @keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes floatB { 0%,100% { transform: translateY(-5px); } 50% { transform: translateY(5px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 60% { transform: translateY(-6px); } }
        .float-a { animation: floatA 5s ease-in-out infinite; }
        .float-b { animation: floatB 6s ease-in-out infinite; }
        .float-c { animation: floatC 4.5s ease-in-out infinite; }

        [data-reveal] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        [data-reveal].visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-group .stagger-item {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .stagger-group.visible .stagger-item:nth-child(1) { opacity: 1; transform: none; transition-delay: 0.05s; }
        .stagger-group.visible .stagger-item:nth-child(2) { opacity: 1; transform: none; transition-delay: 0.15s; }
        .stagger-group.visible .stagger-item:nth-child(3) { opacity: 1; transform: none; transition-delay: 0.25s; }

        .scroll-indicator {
          position: absolute;
          bottom: 1.5rem;
          left: 25%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          z-index: 10;
        }
        .scroll-indicator span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6b7a99;
        }
        .scroll-mouse {
          width: 22px;
          height: 34px;
          border-radius: 11px;
          border: 2px solid rgba(11,25,87,0.3);
          position: relative;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }
        .scroll-mouse::after {
          content: "";
          width: 3px;
          height: 8px;
          border-radius: 2px;
          background: #0b1957;
          opacity: 0.6;
          animation: scrollDown 1.6s ease-in-out infinite;
        }
        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          .float-a, .float-b, .float-c, .scroll-mouse::after {
            animation: none !important;
          }
          [data-reveal], .stagger-group .stagger-item {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </>
  );
};

export default Homepage;
