import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import api from "../lib/api";

const STATUS_CONFIG = {
  PENDING: {
    label: "Payment pending",
    className: "bg-amber-100 text-amber-800",
    Icon: Clock3,
  },
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800",
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-700",
    Icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-800",
    Icon: ShieldAlert,
  },
  PAST_DUE: {
    label: "Past due",
    className: "bg-orange-100 text-orange-800",
    Icon: ShieldAlert,
  },
};

const formatPrice = (price, currency = "INR") => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return `${currency} ${price ?? ""}`;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatInterval = (interval) => {
  if (interval === "MONTHLY") return "Monthly";
  if (interval === "YEARLY") return "Yearly";
  return interval ? String(interval).toLowerCase() : "Membership";
};

const getSubscriptionsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.subscriptions)) return data.subscriptions;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export default function MyMembership() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/subscriptions/my");
      setSubscriptions(getSubscriptionsFromResponse(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't load your memberships. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "ACTIVE"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-5 py-12 text-white sm:py-16">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-green-50">
              <Crown size={16} />
              GoodRound Member Area
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Memberships
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-50/85 sm:text-base">
              View your membership plans, billing periods, and current
              subscription status in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSubscriptions}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
        {!loading && !error && subscriptions.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total subscriptions</p>
              <p className="mt-2 text-3xl font-bold">{subscriptions.length}</p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm text-green-800">Active memberships</p>
              <p className="mt-2 text-3xl font-bold text-green-900">
                {activeCount}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <LoaderCircle className="animate-spin text-green-800" size={36} />
            <p className="text-sm text-slate-600">
              Loading your memberships...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <ShieldAlert className="mx-auto text-red-600" size={38} />
            <h2 className="mt-4 text-xl font-bold">Unable to load memberships</h2>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchSubscriptions}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && subscriptions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-800">
              <Crown size={32} />
            </div>
            <h2 className="mt-5 text-2xl font-bold">No memberships yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              You haven't created a membership subscription yet. Explore the
              available plans and choose the one that works for you.
            </p>
            <Link
              to="/membership"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900"
            >
              Explore plans <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {!loading && !error && subscriptions.length > 0 && (
          <div className="space-y-5">
            {subscriptions.map((subscription) => {
              const plan = subscription.plan || {};
              const status =
                STATUS_CONFIG[subscription.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = status.Icon;

              return (
                <article
                  key={subscription.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-800">
                        <Crown size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">
                          {plan.name || "GoodRound Membership"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatInterval(plan.billingInterval)} billing
                        </p>
                        <div
                          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
                        >
                          <StatusIcon size={14} />
                          {status.label}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-2xl font-bold">
                        {formatPrice(plan.price, plan.currency)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        per {formatInterval(plan.billingInterval).toLowerCase().replace("ly", "")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Start date
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(subscription.startsAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          End date
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(subscription.endsAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard
                        size={18}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Subscription ID
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold">
                          {subscription.id || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.status === "PENDING" && (
                    <div
                      role="status"
                      className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                    >
                      Your subscription request has been created, but payment
                      has not been completed. Your membership is not active yet.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center text-sm text-slate-500">
          Want to explore another plan?{" "}
          <Link
            to="/membership"
            className="font-semibold text-green-800 hover:underline"
          >
            View membership plans
          </Link>
        </div>
      </section>
    </main>
  );
}
