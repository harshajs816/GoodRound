
import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const requestedPath = location.state?.from?.pathname;
  const safeRequestedPath =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? `${requestedPath}${location.state.from.search || ""}${location.state.from.hash || ""}`
      : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.success || !data.token || !data.user) {
        setErrorMessage(
          "Unexpected response from the server. Please try again."
        );
        return;
      }

      login(data);
      navigate(
        safeRequestedPath ||
          (data.user.role === "ADMIN" ? "/admin" : "/dashboard"),
        { replace: true }
      );
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f8f3]">
        <p className="font-medium text-emerald-800">
          Checking your session...
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={
          safeRequestedPath ||
          (user.role === "ADMIN" ? "/admin" : "/dashboard")
        }
        replace
      />
    );
  }

  return (
    <section className="bg-[#f5f8f3] px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-extrabold text-emerald-950">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-600">
          Log in to your GoodRound account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              placeholder="Enter your password"
            />
          </label>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-full bg-emerald-800 px-5 py-3.5 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to GoodRound?{" "}
          <Link to="/signup" className="font-bold text-emerald-800">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
