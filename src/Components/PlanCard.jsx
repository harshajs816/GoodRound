
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const features = [
  "Access to your member dashboard",
  "Record and track golf scores",
  "Support participating charities",
];

export default function PlanCard({ plan }) {
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(plan.price));

  const yearly = plan.billingInterval === "YEARLY";

  return (
    <article className="flex h-full flex-col rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
        {yearly ? "Yearly plan" : "Monthly plan"}
      </span>

      <h3 className="mt-5 text-xl font-bold text-emerald-950">
        {plan.name}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {plan.description || "Join GoodRound and support community impact."}
      </p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-emerald-950">
          {price}
        </span>
        <span className="text-sm text-slate-500">
          / {yearly ? "year" : "month"}
        </span>
      </div>

      <ul className="mt-7 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
            <Check size={18} className="mt-0.5 shrink-0 text-emerald-700" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to="/signup"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900"
      >
        Choose plan <ArrowRight size={16} />
      </Link>

      <p className="mt-3 text-center text-xs text-slate-400">
        Membership checkout is not yet enabled.
      </p>
    </article>
  );
}
