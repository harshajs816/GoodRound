
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Crown,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "../lib/api";


const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });


const formatPrice = (price, currency = "INR") => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return `${currency} ${price}`;

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

const formatInterval = (interval) => {
  if (interval === "MONTHLY") return "month";
  if (interval === "YEARLY") return "year";
  return String(interval || "").toLowerCase();
};

export default function Membership() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billingInterval, setBillingInterval] = useState("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [notice, setNotice] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/subscriptions/plans");

      // Supports both { plans: [...] } and direct array responses.
      const data = response.data;
      const receivedPlans = Array.isArray(data)
        ? data
        : data.plans || data.data || [];

      setPlans(receivedPlans.filter((plan) => plan.isActive !== false));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't load membership plans. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const visiblePlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.billingInterval === billingInterval
      ),
    [plans, billingInterval]
  );

 
const handleSelectPlan = async (plan) => {
  setNotice("");
  setError("");

  const token = localStorage.getItem("goodround_token");

  if (!token) {
    navigate("/login", {
      state: { from: "/membership", planId: plan.id },
    });
    return;
  }

  if (submittingPlan) return;

  setSelectedPlan(plan);
  setSubmittingPlan(true);

  try {
    const loaded = await loadRazorpayScript();

    if (!loaded || !window.Razorpay) {
      throw new Error("Unable to load Razorpay Checkout.");
    }

    const { data } = await api.post("/payments/create-order", {
      planId: plan.id,
    });

    const { keyId, order, subscriptionId } = data;

    if (!keyId || !order?.id || !subscriptionId) {
      throw new Error("Invalid payment order response.");
    }

    const checkout = new window.Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: "GoodRound",
      description: `${plan.name} membership`,
      order_id: order.id,
      theme: { color: "#166534" },

      handler: async (payment) => {
        setNotice("Verifying your payment...");

        try {
          const result = await api.post("/payments/verify", {
            razorpay_order_id: payment.razorpay_order_id,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_signature: payment.razorpay_signature,
          });

          if (!result.data?.success) {
            throw new Error("Payment verification failed.");
          }

          navigate("/my-membership", {
            replace: true,
            state: { paymentSuccess: true, subscriptionId },
          });
        } catch (err) {
          setNotice(
            err.response?.data?.message ||
              "Payment verification is pending. Check My Membership before retrying."
          );
        } finally {
          setSubmittingPlan(false);
        }
      },

      modal: {
        ondismiss: () => {
          setNotice(
            "Checkout closed. Your membership has not been confirmed."
          );
          setSubmittingPlan(false);
        },
      },
    });

    checkout.on("payment.failed", (event) => {
      setNotice(
        event.error?.description || "Payment failed. Please try again."
      );
      setSubmittingPlan(false);
    });

    checkout.open();
  } catch (err) {
    setNotice(
      err.response?.data?.message ||
        err.message ||
        "Unable to start checkout."
    );
    setSubmittingPlan(false);
  }
};


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-5 py-16 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-green-50">
            <Sparkles size={16} />
            GoodRound Membership
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Play more. Enjoy more.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-green-50/85 sm:text-lg">
            Choose the membership plan that fits your game.
            Compare available plans and find the right option for you.
          </p>

<button
  type="button"
  onClick={() => {
    document.getElementById("membership-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }}
  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-green-900 transition hover:bg-green-50"
>
  Explore Memberships <ArrowRight size={18} />
</button>

        </div>
      </section>

      {/* Plans */}
      <section
        id="membership-plans"
        className="mx-auto max-w-6xl px-5 py-14 sm:py-16"
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-800">
            Membership plans
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Find your perfect plan
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Explore our currently available membership options.
            Prices and descriptions are loaded directly from GoodRound.
          </p>
        </div>

        {/* Billing selector */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {["MONTHLY", "YEARLY"].map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => {
                  setBillingInterval(interval);
                  setSelectedPlan(null);
                  setNotice("");
                }}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  billingInterval === interval
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {interval === "MONTHLY" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3">
            <LoaderCircle className="animate-spin text-green-800" size={36} />
            <p className="text-sm text-slate-600">
              Loading membership plans...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              Unable to load plans
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchPlans}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 font-semibold text-white hover:bg-green-900"
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visiblePlans.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Crown className="mx-auto text-slate-400" size={38} />
            <h3 className="mt-4 text-xl font-semibold">
              No {billingInterval.toLowerCase()} plans available
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              There are currently no active plans for this billing period.
              Please check back later.
            </p>
            {billingInterval === "YEARLY" && (
              <button
                type="button"
                onClick={() => setBillingInterval("MONTHLY")}
                className="mt-5 font-semibold text-green-800 hover:underline"
              >
                View monthly plans
              </button>
            )}
          </div>
        )}

        {/* Plan cards */}
        {!loading && !error && visiblePlans.length > 0 && (
          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;

              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    isSelected
                      ? "border-green-700 ring-2 ring-green-700/15"
                      : "border-slate-200"
                  }`}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-800">
                    <Crown size={25} />
                  </div>

                  <h3 className="text-xl font-bold">{plan.name}</h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {plan.description || "GoodRound membership plan."}
                  </p>

                  <div className="mt-6 border-b border-slate-100 pb-6">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-sm text-slate-500">
                        / {formatInterval(plan.billingInterval)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Billed {formatInterval(plan.billingInterval)}
                    </p>
                  </div>

                  <div className="my-6 flex-1">
                    <p className="mb-4 text-sm font-semibold text-slate-800">
                      Plan overview
                    </p>
                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-start gap-3">
                        <Check
                          size={18}
                          className="mt-0.5 shrink-0 text-green-700"
                        />
                        <span>
                          {plan.billingInterval === "YEARLY"
                            ? "Yearly billing period"
                            : "Monthly billing period"}
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check
                          size={18}
                          className="mt-0.5 shrink-0 text-green-700"
                        />
                        <span>Membership managed by GoodRound</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ShieldCheck
                          size={18}
                          className="mt-0.5 shrink-0 text-green-700"
                        />
                        <span>Plan details available before checkout</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={submittingPlan}
                    className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? "bg-green-100 text-green-900"
                        : "bg-green-800 text-white hover:bg-green-900"
                    }`}
                  >
                    {submittingPlan && isSelected ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isSelected ? "Plan selected" : "Choose this plan"}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* Selection notice */}
        {notice && (
          <div
            role="status"
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          >
            {notice}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-slate-500">
          Need help choosing?{" "}
          <Link
            to="/"
            className="font-semibold text-green-800 hover:underline"
          >
            Return to GoodRound
          </Link>
        </p>
      </section>
    </main>
  );
}
