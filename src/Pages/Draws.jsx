import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Ticket,
  Gift,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Info,
  Star,
  Shuffle,
  Zap,
  Upload,
  AlertCircle,
  X,
  Hash,
  Target,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MATCH_LABELS = {
  FIVE_MATCH: "5-Number Jackpot 🏆",
  FOUR_MATCH: "4-Number Match",
  THREE_MATCH: "3-Number Match",
};

const PAYOUT_COLORS = {
  PENDING: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-blue-100 text-blue-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  DRAFT: "bg-slate-100 text-slate-600",
  OPEN: "bg-blue-100 text-blue-700",
  SIMULATED: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS_USER = {
  DRAFT: "Coming soon",
  OPEN: "Open — Enter now!",
  SIMULATED: "Draw pending",
  PUBLISHED: "Results published",
  CANCELLED: "Cancelled",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// ── Entry Confirmation Modal ───────────────────────────────────────────────
function EntryConfirmModal({ draw, myScores, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-emerald-950">Confirm Draw Entry</h2>
            <p className="mt-1 text-sm text-slate-500">{draw.title}</p>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <Hash size={15} /> Your entry numbers
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Your last {myScores.length} golf scores automatically become your draw entry numbers.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {myScores.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-base font-extrabold text-white shadow">
                  {s.score}
                </span>
                <span className="mt-1 text-xs text-emerald-600">
                  {new Date(s.scoreDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-2">
            <p className="font-bold text-amber-800">5 match</p>
            <p className="text-amber-700 mt-0.5">{formatCurrency(draw.jackpotPool)}</p>
            <p className="text-amber-500 mt-0.5">Jackpot</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-2">
            <p className="font-bold text-blue-800">4 match</p>
            <p className="text-blue-700 mt-0.5">{formatCurrency(draw.fourMatchPool)}</p>
            <p className="text-blue-500 mt-0.5">2nd prize</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2">
            <p className="font-bold text-emerald-800">3 match</p>
            <p className="text-emerald-700 mt-0.5">{formatCurrency(draw.threeMatchPool)}</p>
            <p className="text-emerald-500 mt-0.5">3rd prize</p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Draw type: {draw.drawType === "ALGORITHMIC" ? "⚡ Algorithmic (score-weighted)" : "🎲 Random (lottery-style)"}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {loading ? "Entering…" : "Confirm Entry →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Draws() {
  const { user } = useAuth();

  const [publicDraws, setPublicDraws]         = useState([]);
  const [myEntries, setMyEntries]             = useState([]);
  const [myWins, setMyWins]                   = useState([]);
  const [myScores, setMyScores]               = useState([]);
  const [activeSub, setActiveSub]             = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [pendingDraw, setPendingDraw]         = useState(null);
  const [enteringId, setEnteringId]           = useState(null);
  const [proofWinId, setProofWinId]           = useState(null);
  const [proofUrl, setProofUrl]               = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [notice, setNotice]                   = useState({ type: "", msg: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pubRes, subRes, entryRes, winRes, scoresRes] = await Promise.allSettled([
        api.get("/draws/public"),
        user ? api.get("/subscriptions/my")  : Promise.resolve(null),
        user ? api.get("/draws/my-entries")  : Promise.resolve(null),
        user ? api.get("/draws/my-wins")     : Promise.resolve(null),
        user ? api.get("/golf-scores/my")    : Promise.resolve(null),
      ]);

      if (pubRes.status === "fulfilled")
        setPublicDraws(pubRes.value.data?.draws || []);
      if (subRes.status === "fulfilled" && subRes.value) {
        const subs = subRes.value.data?.subscriptions || [];
        setActiveSub(subs.find((s) => s.status === "ACTIVE") || null);
      }
      if (entryRes.status === "fulfilled" && entryRes.value)
        setMyEntries(entryRes.value.data?.entries || []);
      if (winRes.status === "fulfilled" && winRes.value)
        setMyWins(winRes.value.data?.wins || []);
      if (scoresRes.status === "fulfilled" && scoresRes.value)
        setMyScores(scoresRes.value.data?.golfScores || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const enteredDrawIds = new Set(myEntries.map((e) => e.drawId));

  function handleEnterClick(draw) {
    if (!user) return;
    if (!activeSub) {
      setNotice({ type: "error", msg: "You need an active subscription to enter draws." });
      return;
    }
    if (myScores.length < 3) {
      setNotice({ type: "error", msg: `You only have ${myScores.length} golf score${myScores.length === 1 ? "" : "s"}. At least 3 scores are required to enter a draw.` });
      return;
    }
    setNotice({ type: "", msg: "" });
    setPendingDraw(draw);
  }

  async function handleEnterConfirm() {
    if (!pendingDraw) return;
    try {
      setEnteringId(pendingDraw.id);
      await api.post(`/draws/${pendingDraw.id}/enter`);
      const nums = myScores.slice(0, 5).map((s) => s.score);
      setNotice({
        type: "success",
        msg: `✅ You have entered "${pendingDraw.title}"! Your entry numbers are: ${nums.join(", ")}`,
      });
      setPendingDraw(null);
      await fetchAll();
    } catch (err) {
      setNotice({ type: "error", msg: err.response?.data?.message || "Could not enter draw." });
      setPendingDraw(null);
    } finally {
      setEnteringId(null);
    }
  }

  async function handleProofSubmit(winId) {
    if (!proofUrl.trim()) {
      setNotice({ type: "error", msg: "Please enter a valid image URL." });
      return;
    }
    try {
      setProofSubmitting(true);
      setNotice({ type: "", msg: "" });
      await api.patch(`/draws/winners/${winId}/proof`, { proofImageUrl: proofUrl.trim() });
      setNotice({ type: "success", msg: "Proof submitted successfully. Admin will review it shortly." });
      setProofWinId(null);
      setProofUrl("");
      await fetchAll();
    } catch (err) {
      setNotice({ type: "error", msg: err.response?.data?.message || "Could not submit proof." });
    } finally {
      setProofSubmitting(false);
    }
  }

  const totalWon = myWins.reduce((s, w) => s + Number(w.prizeAmount || 0), 0);

  return (
    <main className="min-h-screen bg-[#f5f8f3]">

      {pendingDraw && (
        <EntryConfirmModal
          draw={pendingDraw}
          myScores={myScores.slice(0, 5)}
          onConfirm={handleEnterConfirm}
          onCancel={() => setPendingDraw(null)}
          loading={!!enteringId}
        />
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 px-5 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-emerald-100">
            <Trophy size={15} /> Monthly Prize Draws
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Draws & Winnings
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100/80">
            Every month GoodRound runs a prize draw for active subscribers. Your last 5 golf scores become your lucky numbers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Subscribe", desc: "Active subscribers automatically qualify for monthly draws.", icon: Star },
              { step: "02", title: "Enter the draw", desc: "Your last 5 Stableford scores are your 5 entry numbers — no manual input needed.", icon: Ticket },
              { step: "03", title: "Check results", desc: "Match 3, 4, or 5 numbers to win from the prize pool.", icon: Gift },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <span className="text-xs font-bold text-emerald-300">{step}</span>
                <div className="mt-2 flex items-center gap-2">
                  <Icon size={16} className="text-emerald-300" />
                  <p className="font-bold">{title}</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-emerald-100/75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-5 py-10">

        {/* Notice */}
        {notice.msg && (
          <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${
            notice.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}>
            {notice.type === "success"
              ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
            <span>{notice.msg}</span>
          </div>
        )}

        {/* Current entry numbers */}
        {user && myScores.length > 0 && (
          <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-emerald-950">
                  <Target size={18} className="text-emerald-700" />
                  Your current entry numbers
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These {myScores.length} numbers will be used whenever you enter a draw.
                </p>
              </div>
              <Link to="/golf-scores" className="shrink-0 text-xs font-bold text-emerald-700 hover:underline">
                Update scores →
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {myScores.slice(0, 5).map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-lg font-extrabold text-white shadow-sm">
                    {s.score}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(s.scoreDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-bold">Note:</span> Adding new scores updates your entry numbers. Even after entering a draw, your numbers update with your latest scores.
            </p>
          </section>
        )}

        {/* No subscription warning */}
        {user && !loading && !activeSub && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Info size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">No active subscription</p>
              <p className="mt-1">An active membership is required to enter draws.</p>
              <Link to="/membership" className="mt-2 inline-flex items-center gap-1 font-bold text-amber-900 hover:underline">
                Subscribe now <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* Prize pool explainer */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-extrabold text-emerald-950">How the prize pool works</h2>
          <p className="mb-5 text-sm text-slate-500">The admin sets the total prize pool for each draw. It is split across three tiers:</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { tier: "5 Numbers Match", label: "Jackpot", share: "40%", color: "bg-amber-50 border-amber-200 text-amber-800", note: "No winner → carries over to next draw" },
              { tier: "4 Numbers Match", label: "2nd Prize", share: "35%", color: "bg-blue-50 border-blue-200 text-blue-800", note: "Multiple winners → split equally" },
              { tier: "3 Numbers Match", label: "3rd Prize", share: "25%", color: "bg-emerald-50 border-emerald-200 text-emerald-800", note: "Multiple winners → split equally" },
            ].map((t) => (
              <div key={t.tier} className={`rounded-2xl border p-4 ${t.color}`}>
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">{t.label}</p>
                <p className="mt-1 text-2xl font-extrabold">{t.share}</p>
                <p className="mt-1 text-sm font-semibold">{t.tier}</p>
                <p className="mt-1 text-xs opacity-60">{t.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Shuffle size={13} className="text-slate-500" />
              <strong>Random:</strong> Any 5 numbers from 1–45 — equal chance for all
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-amber-500" />
              <strong>Algorithmic:</strong> Common golf scores from that month get higher weight
            </span>
          </div>
        </section>

        {/* Draws list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-emerald-950">Active Draws</h2>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center text-slate-500">
              Loading draws…
            </div>
          ) : publicDraws.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Trophy size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No draws available yet</p>
              <p className="mt-1 text-sm text-slate-500">Draws are published monthly — check back soon.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {publicDraws.map((draw) => {
                const myEntry = myEntries.find((e) => e.drawId === draw.id);
                const alreadyEntered = !!myEntry;
                const entryNumbers = myEntry?.numbers || [];
                const drawnNums = draw.drawnNumbers || [];
                const matchCount = entryNumbers.filter((n) => drawnNums.includes(n)).length;

                return (
                  <article key={draw.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-emerald-950">{draw.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[draw.status] || ""}`}>
                            {STATUS_LABELS_USER[draw.status] || draw.status}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            {draw.drawType === "ALGORITHMIC"
                              ? <><Zap size={11} /> Algorithmic</>
                              : <><Shuffle size={11} /> Random</>}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {MONTH_NAMES[draw.drawMonth]} {draw.drawYear}
                          {draw.publishedAt && ` · Published ${new Date(draw.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                        </p>

                        {/* Prize pool tags */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                            🏆 Jackpot: {formatCurrency(draw.jackpotPool)}
                          </span>
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                            4-match: {formatCurrency(draw.fourMatchPool)}
                          </span>
                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                            3-match: {formatCurrency(draw.threeMatchPool)}
                          </span>
                        </div>

                        {/* Official drawn numbers */}
                        {drawnNums.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Official drawn numbers:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {drawnNums.map((n) => (
                                <span
                                  key={n}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-sm font-extrabold text-white shadow"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* User entry vs drawn numbers */}
                        {alreadyEntered && entryNumbers.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="mb-2 text-xs font-bold text-emerald-800">
                              Your entry numbers
                              {drawnNums.length > 0 && (
                                <span className="ml-2 rounded-full bg-emerald-800 px-2 py-0.5 text-white">
                                  {matchCount} match{matchCount !== 1 ? "es" : ""}
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {entryNumbers.map((n) => {
                                const isMatch = drawnNums.includes(n);
                                return (
                                  <div key={n} className="flex flex-col items-center gap-0.5">
                                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition ${
                                      drawnNums.length === 0
                                        ? "bg-emerald-700 text-white"
                                        : isMatch
                                          ? "bg-amber-400 text-amber-950 ring-2 ring-amber-600 shadow-md"
                                          : "border-2 border-slate-200 bg-white text-slate-500"
                                    }`}>
                                      {n}
                                    </span>
                                    {drawnNums.length > 0 && (
                                      <span className={`text-xs font-semibold ${isMatch ? "text-amber-700" : "text-slate-400"}`}>
                                        {isMatch ? "✓" : "✗"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {drawnNums.length > 0 && (
                              <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
                                matchCount >= 5 ? "bg-amber-100 text-amber-800"
                                : matchCount >= 4 ? "bg-blue-100 text-blue-800"
                                : matchCount >= 3 ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                              }`}>
                                {matchCount >= 5 && "🏆 Jackpot! You matched 5 numbers! Upload your proof to claim your prize."}
                                {matchCount === 4 && "🎉 4 numbers matched! You win the 2nd prize. Upload proof to claim."}
                                {matchCount === 3 && "✅ 3 numbers matched! You win the 3rd prize. Upload proof to claim."}
                                {matchCount < 3 && `${matchCount} number${matchCount !== 1 ? "s" : ""} matched — no prize this time. Try the next draw!`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Enter button — only when OPEN */}
                      {user && draw.status === "OPEN" && (
                        <div className="shrink-0">
                          {alreadyEntered ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                              <CheckCircle2 size={15} /> Entered
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEnterClick(draw)}
                              disabled={!activeSub}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Ticket size={15} /> Enter Draw
                            </button>
                          )}
                        </div>
                      )}

                      {/* Entered badge after draw closes */}
                      {user && draw.status !== "OPEN" && alreadyEntered && (
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                            <CheckCircle2 size={15} /> Entered
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* My Wins */}
        {user && myWins.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-emerald-950">Your Winnings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Total won: <span className="font-bold text-emerald-800">{formatCurrency(totalWon)}</span>
              </p>
            </div>

            <div className="space-y-4">
              {myWins.map((win) => (
                <article key={win.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-emerald-950">
                          {MATCH_LABELS[win.matchType] || win.matchType}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYOUT_COLORS[win.payoutStatus] || ""}`}>
                          {win.payoutStatus}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {win.draw?.title} · {MONTH_NAMES[win.draw?.drawMonth]} {win.draw?.drawYear}
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-emerald-800">
                        {formatCurrency(win.prizeAmount)}
                      </p>

                      {win.payoutStatus === "PENDING" && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                          <p className="font-bold">Action required</p>
                          <p className="mt-1">
                            Upload a screenshot of your scores from your golf platform as proof. Admin will verify and process your payment.
                          </p>
                        </div>
                      )}
                      {win.payoutStatus === "VERIFIED" && (
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          ✓ Verified — your payment will be processed soon.
                        </p>
                      )}
                      {win.payoutStatus === "PAID" && (
                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                          ✓ Paid — Congratulations! 🎉
                        </p>
                      )}
                      {win.payoutStatus === "REJECTED" && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          ✗ Rejected — please contact support if you believe this is an error.
                        </p>
                      )}
                    </div>

                    {/* Proof upload */}
                    {win.payoutStatus === "PENDING" && (
                      <div className="shrink-0">
                        {proofWinId === win.id ? (
                          <div className="w-64 space-y-2">
                            <input
                              type="url"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              placeholder="https://imgur.com/screenshot.png"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="text-xs text-slate-400">
                              Paste the URL of your score screenshot (e.g. from Imgur)
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleProofSubmit(win.id)}
                                disabled={proofSubmitting}
                                className="flex-1 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                              >
                                {proofSubmitting ? "Submitting…" : "Submit"}
                              </button>
                              <button
                                onClick={() => { setProofWinId(null); setProofUrl(""); }}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setProofWinId(win.id); setNotice({ type: "", msg: "" }); }}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            <Upload size={14} />
                            {win.proofImageUrl ? "Update proof" : "Upload proof"}
                          </button>
                        )}
                        {win.proofImageUrl && proofWinId !== win.id && (
                          <a
                            href={win.proofImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block text-center text-xs font-medium text-emerald-700 hover:underline"
                          >
                            View submitted proof ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Not logged in */}
        {!user && (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-emerald-300" />
            <h2 className="text-xl font-bold text-emerald-950">Log in to enter draws</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create an account and subscribe to participate in monthly prize draws.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900"
              >
                Log in <ArrowRight size={16} />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Create account
              </Link>
            </div>
          </section>
        )}

        {user && !loading && myWins.length === 0 && publicDraws.length > 0 && (
          <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <Gift size={36} className="mx-auto mb-3 text-slate-300" />
            <h2 className="font-bold text-slate-700">No winnings yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter a draw and match 3 or more numbers to win from the prize pool.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
