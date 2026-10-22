
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Trophy,
  CreditCard,
  Heart,
  UserRound,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f8f3]">
        <p className="font-medium text-emerald-800">Loading your dashboard...</p>
      </div>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  const actions = [
    {
      title: "Golf scores",
      description: "Record your rounds and keep track of your latest five scores.",
      icon: Trophy,
      link: "/golf-scores",
      label: "Manage scores",
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: "Membership",
      description: "Explore monthly and yearly membership options.",
      icon: CreditCard,
      link: "/membership",
      label: "Explore plans",
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: "Charities",
      description: "Discover verified charities and the causes they support.",
      icon: Heart,
      link: "/charities",
      label: "Discover charities",
      iconStyle: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              GOODROUND / MEMBER AREA
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
              Your dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Your game. Your community. Your impact.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:self-auto"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>

        {/* Welcome banner */}
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white shadow-lg sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-32 -z-10 h-64 w-64 rounded-full bg-emerald-800/40 blur-3xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <Sparkles size={14} />
              Welcome to GoodRound
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
              Good to see you,
              <span className="block text-emerald-300">{firstName}.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100/80 sm:text-base">
              Keep your golf journey organised and discover ways to support
              causes that matter to you.
            </p>

            <Link
              to="/golf-scores"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-100"
            >
              Explore your golf activity
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* Main content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Quick actions */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-emerald-950">
                Your GoodRound
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Everything you need, in one place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <article
                    key={action.title}
                    className="group flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className={`w-fit rounded-2xl p-3 ${action.iconStyle}`}>
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 font-extrabold text-emerald-950">
                      {action.title}
                    </h3>

                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                      {action.description}
                    </p>

                    <Link
                      to={action.link}
                      className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-800"
                    >
                      {action.label}
                      <ChevronRight
                        size={17}
                        className="transition group-hover:translate-x-1"
                      />
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Profile card */}
          <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-emerald-950">
                Your profile
              </h2>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
                <UserRound size={21} />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#f5f8f3] p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-lg font-extrabold text-white">
                {(user.name?.trim().charAt(0) || "U").toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold text-emerald-950">
                  {user.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <span className="text-sm text-slate-500">Account role</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                  {user.role?.toLowerCase() || "user"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Account status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <ShieldCheck size={16} />
                  {user.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-sm font-bold text-emerald-950">
                Small actions, meaningful impact.
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-900/70">
                Explore the charities listed on GoodRound to learn about their
                work and the communities they support.
              </p>
              <Link
                to="/charities"
                className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-emerald-800 hover:text-emerald-950"
              >
                Explore causes <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          GoodRound · Your member space
        </p>
      </div>
    </main>
  );
}
