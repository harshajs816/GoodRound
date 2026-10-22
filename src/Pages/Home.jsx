
import { Link } from "react-router-dom";
import { ArrowRight, Heart, ShieldCheck, Trophy } from "lucide-react";
import { useSubscriptionPlans } from "../lib/queries";
import PlanCard from "../Components/PlanCard";

export default function Home() {
  const {
    data: plans = [],
    isPending,
    isError,
    refetch,
  } = useSubscriptionPlans();

  const visiblePlans = plans.filter((plan) => plan.isActive !== false);

  return (
    <>
      <section className="overflow-hidden bg-[#f5f8f3]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-4 py-2 text-sm font-semibold text-emerald-900">
              <Heart size={16} className="text-emerald-700" />
              Play golf. Make an impact.
            </span>

            <h1 className="mt-7 max-w-xl text-5xl font-extrabold leading-[1.08] tracking-tight text-emerald-950 sm:text-6xl">
              Every round can make a
              <span className="text-emerald-700"> difference.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              GoodRound connects your love of golf with meaningful community
              impact. Track your scores, explore charities and follow your
              membership in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-4 font-bold text-white transition hover:bg-emerald-900"
              >
                Get started <ArrowRight size={18} />
              </Link>
              <Link
                to="/membership"
                className="rounded-full border border-emerald-950/15 bg-white px-6 py-4 font-bold text-emerald-950 transition hover:bg-emerald-50"
              >
                Explore membership
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-700" />
                Member dashboard
              </span>
              <span className="flex items-center gap-2">
                <Heart size={17} className="text-emerald-700" />
                Charity discovery
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[3rem] bg-emerald-200/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-emerald-900 p-8 text-white shadow-2xl sm:p-12">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-white/10" />

              <div className="relative flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-100">
                  YOUR GAME, YOUR IMPACT
                </span>
                <Trophy size={24} className="text-emerald-300" />
              </div>

              <div className="relative mt-16">
                <p className="text-sm text-emerald-200">A better way to play</p>
                <p className="mt-2 text-4xl font-extrabold sm:text-5xl">
                  Golf with purpose.
                </p>
                <p className="mt-4 max-w-sm leading-7 text-emerald-100/80">
                  Keep track of your scores and discover opportunities to
                  support causes that matter.
                </p>
              </div>

              <div className="relative mt-12 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <Heart className="mb-3 text-emerald-300" size={22} />
                  <p className="font-bold">Community</p>
                  <p className="mt-1 text-xs text-emerald-100/70">
                    Discover charities
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <Trophy className="mb-3 text-emerald-300" size={22} />
                  <p className="font-bold">Your progress</p>
                  <p className="mt-1 text-xs text-emerald-100/70">
                    Track golf scores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Simple by design
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
              A few steps. A meaningful difference.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Join GoodRound",
                text: "Create your account and explore the membership options.",
              },
              {
                number: "02",
                title: "Track your game",
                text: "Record your golf scores and review your recent rounds.",
              },
              {
                number: "03",
                title: "Discover your impact",
                text: "Explore participating charities and ways to contribute.",
              },
            ].map((item) => (
              <article key={item.number} className="rounded-3xl border border-slate-100 bg-[#f8faf7] p-7">
                <span className="text-sm font-extrabold text-emerald-700">
                  {item.number}
                </span>
                <h3 className="mt-5 text-xl font-bold text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className="bg-emerald-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              Built around giving
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">
              Find causes worth supporting.
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-emerald-100/75">
              Browse charities, learn about their missions and explore
              contribution options through GoodRound.
            </p>
          </div>
          <Link
            to="/charities"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-emerald-950 hover:bg-emerald-50"
          >
            Explore charities <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section id="pricing" className="bg-[#f5f8f3] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Membership
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-emerald-950 sm:text-4xl">
                Choose your plan.
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Compare the available membership options.
              </p>
            </div>
            <Link
              to="/membership"
              className="inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950"
            >
              View membership <ArrowRight size={17} />
            </Link>
          </div>

          {isPending && (
            <p className="mt-10 text-slate-600" role="status">
              Loading membership plans…
            </p>
          )}

          {isError && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-white p-6">
              <p className="text-red-700">
                Plans are temporarily unavailable. Please try again.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-full bg-emerald-800 px-5 py-2.5 font-semibold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!isPending && !isError && visiblePlans.length === 0 && (
            <p className="mt-10 text-slate-600">
              No membership plans are currently available.
            </p>
          )}

          {!isPending && !isError && visiblePlans.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {visiblePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
