import { useCallback, useEffect, useState } from "react";
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
  Crown,
  Gift,
  CheckCircle2,
  Clock3,
  XCircle,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "../lib/api";

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", className: "text-emerald-700", Icon: CheckCircle2 },
  PENDING: { label: "Pending", className: "text-amber-600", Icon: Clock3 },
  CANCELLED: { label: "Cancelled", className: "text-slate-500", Icon: XCircle },
  EXPIRED: { label: "Expired", className: "text-red-600", Icon: ShieldAlert },
  PAST_DUE: { label: "Past Due", className: "text-orange-600", Icon: ShieldAlert },
};

const MATCH_LABELS = {
  FIVE_MATCH: "5-Number Jackpot",
  FOUR_MATCH: "4-Number Match",
  THREE_MATCH: "3-Number Match",
};

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [draws, setDraws] = useState([]);
  const [wins, setWins] = useState([]);
  const [charities, setCharities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [charityUpdating, setCharityUpdating] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [subRes, drawRes, winRes, charRes] = await Promise.allSettled([
        api.get("/subscriptions/my"),
        api.get("/draws/my-entries"),
        api.get("/draws/my-wins"),
        api.get("/charities"),
      ]);

      if (subRes.status === "fulfilled") {
        const subs = subRes.value.data?.subscriptions || [];
        const active = subs.find((s) => s.status === "ACTIVE") || subs[0] || null;
        setSubscription(active);
      }
      if (drawRes.status === "fulfilled") setDraws(drawRes.value.data?.entries || []);
      if (winRes.status === "fulfilled") setWins(winRes.value.data?.wins || []);
      if (charRes.status === "fulfilled") setCharities(charRes.value.data?.charities || []);
    } catch {
      // Non-critical — dashboard still renders with partial data
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  async function handleCharityChange(charityId) {
    try {
      setCharityUpdating(true);
      setNotice("");
      await api.patch("/auth/profile", { selectedCharityId: charityId || null });
      // Refresh user in auth context by re-fetching
      const res = await api.get("/auth/me");
      // We can't directly update AuthContext user here without a setter,
      // so we show a notice and suggest refresh
      setNotice("Charity preference saved! Refresh the page to see the update.");
    } catch (err) {
      setNotice(err.response?.data?.message || "Could not update charity preference.");
    } finally {
      setCharityUpdating(false);
    }
  }

  async function handleContributionChange(pct) {
    try {
      setCharityUpdating(true);
      setNotice("");
      await api.patch("/auth/profile", { charityContribution: Number(pct) });
      setNotice("Contribution percentage updated.");
    } catch (err) {
      setNotice(err.response?.data?.message || "Could not update contribution.");
    } finally {
      setCharityUpdating(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f8f3]">
        <p className="font-medium text-emerald-800">Loading your dashboard...</p>
      </div>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";
  const activeSub = subscription;
  const subStatus = activeSub ? STATUS_CONFIG[activeSub.status] || STATUS_CONFIG.PENDING : null;
  const totalWon = wins.reduce((sum, w) => sum + Number(w.prizeAmount || 0), 0);
  const pendingPayouts = wins.filter((w) => w.payoutStatus === "PENDING").length;
  const upcomingDraws = draws.filter((d) => d.draw?.status !== "PUBLISHED");
  const selectedCharity = user.selectedCharity;
  const contributionPct = user.charityContribution || 10;

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">GOODROUND / MEMBER AREA</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">Your dashboard</h1>
            <p className="mt-2 text-slate-600">Your game. Your community. Your impact.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchDashboardData} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={17} /> Log out
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Welcome banner */}
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white shadow-lg sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-32 -z-10 h-64 w-64 rounded-full bg-emerald-800/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <Sparkles size={14} /> Welcome to GoodRound
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
              Good to see you,<span className="block text-emerald-300">{firstName}.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100/80 sm:text-base">
              Keep your golf journey organised, enter monthly draws and support causes that matter.
            </p>
            <Link to="/golf-scores" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-950 hover:bg-emerald-100">
              Manage golf scores <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* ── Stats row ── */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Subscription status */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Subscription</p>
              <CreditCard size={18} className="text-slate-400" />
            </div>
            {dataLoading ? (
              <p className="mt-3 text-slate-400">Loading…</p>
            ) : activeSub && subStatus ? (
              <>
                <div className={`mt-3 flex items-center gap-1.5 text-sm font-bold ${subStatus.className}`}>
                  <subStatus.Icon size={15} />{subStatus.label}
                </div>
                <p className="mt-1 text-xs text-slate-500">{activeSub.plan?.name}</p>
                {activeSub.endsAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Renews {new Date(activeSub.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-sm font-semibold text-slate-700">No active plan</p>
                <Link to="/membership" className="mt-2 block text-xs font-bold text-emerald-700 hover:underline">Subscribe →</Link>
              </>
            )}
          </div>

          {/* Draw entries */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Draw Entries</p>
              <Trophy size={18} className="text-slate-400" />
            </div>
            {dataLoading ? <p className="mt-3 text-slate-400">Loading…</p> : (
              <>
                <p className="mt-3 text-2xl font-extrabold text-emerald-950">{draws.length}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {upcomingDraws.length} upcoming draw{upcomingDraws.length !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </div>

          {/* Winnings */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Total Won</p>
              <Gift size={18} className="text-slate-400" />
            </div>
            {dataLoading ? <p className="mt-3 text-slate-400">Loading…</p> : (
              <>
                <p className="mt-3 text-2xl font-extrabold text-emerald-950">
                  ₹{totalWon.toFixed(0)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {pendingPayouts} payout{pendingPayouts !== 1 ? "s" : ""} pending
                </p>
              </>
            )}
          </div>

          {/* Charity */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Charity Impact</p>
              <Heart size={18} className="text-slate-400" />
            </div>
            {dataLoading ? <p className="mt-3 text-slate-400">Loading…</p> : (
              <>
                <p className="mt-3 text-sm font-bold text-emerald-900 truncate">
                  {selectedCharity ? selectedCharity.name : "Not selected"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{contributionPct}% of subscription</p>
              </>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: Quick actions + recent wins */}
          <div className="space-y-6">
            {/* Quick actions */}
            <section>
              <div className="mb-5">
                <h2 className="text-xl font-extrabold text-emerald-950">Your GoodRound</h2>
                <p className="mt-1 text-sm text-slate-600">Everything you need, in one place.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Golf scores", description: "Record your rounds and keep track of your latest five Stableford scores.", icon: Trophy, link: "/golf-scores", label: "Manage scores", iconStyle: "bg-amber-50 text-amber-700" },
                  { title: "Membership", description: "Explore monthly and yearly membership options.", icon: CreditCard, link: "/membership", label: "Explore plans", iconStyle: "bg-blue-50 text-blue-700" },
                  { title: "Charities", description: "Discover verified charities and the causes they support.", icon: Heart, link: "/charities", label: "Discover charities", iconStyle: "bg-rose-50 text-rose-700" },
                  { title: "My membership", description: "View your subscription status and billing details.", icon: Crown, link: "/my-membership", label: "View membership", iconStyle: "bg-purple-50 text-purple-700" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <article key={action.title} className="group flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className={`w-fit rounded-2xl p-3 ${action.iconStyle}`}><Icon size={23} /></div>
                      <h3 className="mt-5 font-extrabold text-emerald-950">{action.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{action.description}</p>
                      <Link to={action.link} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">
                        {action.label}<ChevronRight size={17} className="transition group-hover:translate-x-1" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Winnings overview */}
            {!dataLoading && wins.length > 0 && (
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-emerald-950">Your Winnings</h2>
                  <Gift size={20} className="text-emerald-700" />
                </div>
                <div className="space-y-3">
                  {wins.slice(0, 5).map((win) => (
                    <div key={win.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-bold text-emerald-950">{MATCH_LABELS[win.matchType] || win.matchType}</p>
                        <p className="text-xs text-slate-500">{win.draw?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-emerald-800">₹{Number(win.prizeAmount).toFixed(0)}</p>
                        <span className={`text-xs font-semibold ${
                          win.payoutStatus === "PAID" ? "text-emerald-600"
                          : win.payoutStatus === "VERIFIED" ? "text-blue-600"
                          : win.payoutStatus === "REJECTED" ? "text-red-500"
                          : "text-amber-600"
                        }`}>{win.payoutStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingPayouts > 0 && (
                  <p className="mt-4 text-xs text-amber-700 font-medium">
                    You have {pendingPayouts} pending payout{pendingPayouts > 1 ? "s" : ""}. Upload your score proof to proceed.
                  </p>
                )}
              </section>
            )}

            {/* Draw participation */}
            {!dataLoading && draws.length > 0 && (
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-emerald-950">Draw Participation</h2>
                  <Trophy size={20} className="text-emerald-700" />
                </div>
                <div className="space-y-3">
                  {draws.slice(0, 4).map((entry) => {
                    const d = entry.draw;
                    if (!d) return null;
                    return (
                      <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                        <div>
                          <p className="text-sm font-bold text-emerald-950">{d.title}</p>
                          <p className="text-xs text-slate-500">Numbers: {entry.numbers?.join(", ") || "—"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          d.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700"
                          : d.status === "SIMULATED" ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                        }`}>{d.status}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right: Profile + charity selection */}
          <div className="space-y-5">
            {/* Profile card */}
            <aside className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-emerald-950">Your profile</h2>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800"><UserRound size={21} /></div>
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#f5f8f3] p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-lg font-extrabold text-white">
                  {(user.name?.trim().charAt(0) || "U").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-emerald-950">{user.name}</p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
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
                    <ShieldCheck size={16} />{user.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
            </aside>

            {/* Charity selection card */}
            <aside className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-extrabold text-emerald-950">Charity support</h2>
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700"><Heart size={21} /></div>
              </div>

              {selectedCharity ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 mb-1">Supporting</p>
                  <p className="font-bold text-emerald-950">{selectedCharity.name}</p>
                  <p className="text-sm text-emerald-700 mt-1">{contributionPct}% of your subscription</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 mb-4">Select a charity to direct part of your subscription to a cause you care about.</p>
              )}

              <label className="block mb-3">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select Charity</span>
                <select
                  value={user.selectedCharityId || ""}
                  onChange={(e) => handleCharityChange(e.target.value || null)}
                  disabled={charityUpdating || charities.length === 0}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                >
                  <option value="">— None selected —</option>
                  {charities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contribution % (min. 10%)
                </span>
                <input
                  type="number" min="10" max="100" defaultValue={contributionPct}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val !== contributionPct && val >= 10 && val <= 100) {
                      handleContributionChange(val);
                    }
                  }}
                  disabled={charityUpdating}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-slate-400">Minimum 10%, maximum 100% of subscription fee.</p>
              </label>
            </aside>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">GoodRound · Your member space</p>
      </div>
    </main>
  );
}
