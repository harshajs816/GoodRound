
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const signupMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await api.post("/auth/register", userData);
      return response.data;
    },

    onSuccess: (data) => {
      if (!data.success) {
        setErrorMessage("Registration failed. Please try again.");
        return;
      }

      setSuccessMessage("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
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
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    signupMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <section className="bg-[#f5f8f3] px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-3xl font-extrabold text-emerald-950">
          Join GoodRound
        </h1>

        <p className="mt-2 text-slate-600">
          Create your account to get started.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Full name
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              placeholder="Your full name"
            />
          </label>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              placeholder="At least 8 characters"
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

          {successMessage && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full rounded-full bg-emerald-800 px-5 py-3.5 font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signupMutation.isPending
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-emerald-800">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
