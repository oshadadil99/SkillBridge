import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { getStoredUser, isAuthenticated, storeSession } from "../auth/session";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "";
  }, [location.search]);

  if (isAuthenticated()) {
    const user = getStoredUser();
    const fallback = user?.role === "admin" ? "/admin" : "/course";
    return <Navigate to={redirectTo || fallback} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password
      });

      const token = response.data?.data?.token;
      const user = response.data?.data?.user;

      if (!token || !user) {
        throw new Error("Login failed");
      }

      storeSession({ token, user });

      const fallback = user.role === "admin" ? "/admin" : "/course";
      navigate(redirectTo || fallback, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f2ea] px-4 py-10 text-[#0d2165] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-3xl border border-[#d7d2c7] bg-[#fffdfa] p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c7da7]">SkillBridge Access</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#112765]">Sign In</h1>
        <p className="mt-2 text-sm leading-6 text-[#6c7da7]">
          Log in before buying courses or managing course content.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#1c2f6f]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#c8c4ba] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#1c2f6f]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#c8c4ba] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#10246d] focus:ring-2 focus:ring-[#10246d]/20"
              placeholder="Enter your password"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-[#10246d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d327f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>

            <Link
              to="/course"
              className="inline-flex items-center justify-center rounded-xl border border-[#c8c4ba] px-5 py-2.5 text-sm font-semibold text-[#10246d] transition hover:border-[#10246d]"
            >
              Back to Courses
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Login;
