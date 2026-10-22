import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  PlayCircle,
  Send,
  XCircle,
  CheckCircle,
  Clock,
  Zap,
  Shuffle,
  Trophy,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Users,
} from "lucide-react";
import api from "../lib/api";

const STATUS_COLORS = {
  DRAFT: "bg-slate-100 text-slate-700",
  OPEN: "bg-blue-100 text-blue-700",
  SIMULATED: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  DRAFT: "Draft — not visible to users",
  OPEN: "Open — users can enter",
  SIMULATED: "Simulated — ready to publish",
  PUBLISHED: "Published — results live",
  CANCELLED: "Cancelled",
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DrawManagement() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [form, setForm] = useState({
    title: "",
    drawMonth: new Date().getMonth() + 1,
    drawYear: new Date().getFullYear(),
    drawType: "RANDOM",
    totalPrizePool: "",
  });

  async function fetchDraws() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/draws");
      setDraws(res.data.draws || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load draws.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDraws(); }, []);

  function setActionState(id, state) {
    setActionLoading((prev) => ({ ...prev, [id]: state }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setActionState("create", true);
      setError(""); setNotice("");
      await api.post("/draws", {
        title: form.title.trim(),
        drawMonth: Number(form.drawMonth),
        drawYear: Number(form.drawYear),
        drawType: form.drawType,
        totalPrizePool: Number(form.totalPrizePool),
      });
      setNotice("Draw created successfully.");
      setShowForm(false);
      setForm({ title: "", drawMonth: new Date().getMonth() + 1, drawYear: new Date().getFullYear(), drawType: "RANDOM", totalPrizePool: "" });
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create draw.");
    } finally {
      setActionState("create", false);
    }
  }

  async function handleSimulate(draw) {
    if (!window.confirm(`Run simulation for "${draw.title}"? This will generate drawn numbers.`)) return;
    try {
      setActionState(draw.id, "simulating");
      setError(""); setNotice("");
      const res = await api.post(`/draws/${draw.id}/simulate`);
      setNotice(`Simulation complete! Drawn numbers: ${res.data.draw.drawnNumbers.join(", ")}`);
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not simulate draw.");
    } finally {
      setActionState(draw.id, null);
    }
  }

  async function handlePublish(draw) {
    if (!window.confirm(`Publish "${draw.title}"? This will finalise winners and cannot be undone.`)) return;
    try {
      setActionState(draw.id, "publishing");
      setError(""); setNotice("");
      await api.post(`/draws/${draw.id}/publish`);
      setNotice(`Draw "${draw.title}" published and winners recorded.`);
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not publish draw.");
    } finally {
      setActionState(draw.id, null);
    }
  }

  async function handleCancel(draw) {
    if (!window.confirm(`Cancel "${draw.title}"? This cannot be undone.`)) return;
    try {
      setActionState(draw.id, "cancelling");
      setError(""); setNotice("");
      await api.delete(`/draws/${draw.id}`);
      setNotice(`Draw cancelled.`);
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel draw.");
    } finally {
      setActionState(draw.id, null);
    }
  }

  async function handleDelete(draw) {
    if (!window.confirm(
      `Permanently delete "${draw.title}"?\n\nThis will remove all entries too. This CANNOT be undone.`
    )) return;
    try {
      setActionState(draw.id, "deleting");
      setError(""); setNotice("");
      await api.delete(`/draws/${draw.id}/permanent`);
      setNotice(`Draw "${draw.title}" permanently deleted.`);
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete draw.");
    } finally {
      setActionState(draw.id, null);
    }
  }

  async function handleOpenForEntries(draw) {
    const toStatus = draw.status === "OPEN" ? "DRAFT" : "OPEN";
    const label = toStatus === "OPEN" ? "open for user entries" : "close entries";
    if (!window.confirm(`Mark "${draw.title}" as ${label}?`)) return;
    try {
      setActionState(draw.id, "opening");
      setError(""); setNotice("");
      await api.patch(`/draws/${draw.id}`, { status: toStatus });
      setNotice(`Draw ${toStatus === "OPEN" ? "opened for entries — users can now enter!" : "closed for new entries."}`);
      await fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update draw status.");
    } finally {
      setActionState(draw.id, null);
    }
  }

  const stats = useMemo(() => ({
    total: draws.length,
    published: draws.filter((d) => d.status === "PUBLISHED").length,
    draft: draws.filter((d) => d.status === "DRAFT" || d.status === "OPEN" || d.status === "SIMULATED").length,
    cancelled: draws.filter((d) => d.status === "CANCELLED").length,
  }), [draws]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
          <ArrowLeft size={17} /> Back to Admin Dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-emerald-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wider text-emerald-300">GOODROUND ADMINISTRATION</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Draw Management</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">
              Configure monthly draws, run simulations, publish results and manage winners.
            </p>
            {/* Workflow steps */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {[
                { step: "1", label: "Create draw + set prize pool", color: "bg-white/10" },
                { step: "2", label: "Open for entries (users enter)", color: "bg-blue-500/30" },
                { step: "3", label: "Simulate drawn numbers", color: "bg-amber-500/30" },
                { step: "4", label: "Publish results", color: "bg-emerald-500/30" },
              ].map(({ step, label, color }) => (
                <span key={step} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-white ${color}`}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{step}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); setNotice(""); }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-50"
          >
            <Plus size={19} /> New Draw
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <XCircle size={19} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle size={19} className="mt-0.5 shrink-0" /><span>{notice}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Draws", value: stats.total, color: "text-slate-700", bg: "bg-slate-100" },
            { label: "Published", value: stats.published, color: "text-emerald-700", bg: "bg-emerald-100" },
            { label: "In Progress", value: stats.draft, color: "text-amber-700", bg: "bg-amber-100" },
            { label: "Cancelled", value: stats.cancelled, color: "text-red-600", bg: "bg-red-100" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <p className={`mt-3 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Draw</h2>
                <p className="mt-1 text-sm text-gray-500">Set the prize pool amount and draw type. After creating, open it for entries, then simulate and publish.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Draw Title *</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required maxLength={120}
                    placeholder="e.g. October 2026 Monthly Draw"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Draw Month *</span>
                  <select
                    value={form.drawMonth}
                    onChange={(e) => setForm((f) => ({ ...f, drawMonth: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700"
                  >
                    {MONTH_NAMES.slice(1).map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Draw Year *</span>
                  <input
                    type="number" min="2024" max="2030"
                    value={form.drawYear}
                    onChange={(e) => setForm((f) => ({ ...f, drawYear: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Draw Type</span>
                  <div className="flex gap-4">
                    {["RANDOM", "ALGORITHMIC"].map((t) => (
                      <label key={t} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio" name="drawType" value={t}
                          checked={form.drawType === t}
                          onChange={() => setForm((f) => ({ ...f, drawType: t }))}
                          className="accent-emerald-700"
                        />
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                          {t === "RANDOM" ? <><Shuffle size={15} /> Random (Lottery-style)</> : <><Zap size={15} /> Algorithmic (Score-weighted)</>}
                        </span>
                      </label>
                    ))}
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Total Prize Pool (₹) *
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.totalPrizePool}
                      onChange={(e) => setForm((f) => ({ ...f, totalPrizePool: e.target.value }))}
                      required
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  {form.totalPrizePool > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                      <span>🏆 Jackpot (40%): ₹{(Number(form.totalPrizePool) * 0.40).toLocaleString("en-IN")}</span>
                      <span>4-match (35%): ₹{(Number(form.totalPrizePool) * 0.35).toLocaleString("en-IN")}</span>
                      <span>3-match (25%): ₹{(Number(form.totalPrizePool) * 0.25).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={!!actionLoading.create} className="rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-950 disabled:opacity-60">
                  {actionLoading.create ? "Creating..." : "Create Draw"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Draws list */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Draws</h2>
              <p className="mt-1 text-sm text-gray-500">{draws.length} draws configured</p>
            </div>
            <button onClick={fetchDraws} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading draws…</div>
          ) : draws.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-800">No draws yet</p>
              <p className="mt-1 text-sm text-gray-500">Create your first monthly draw above.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {draws.map((draw) => {
                const isExpanded = expandedId === draw.id;
                const loading = actionLoading[draw.id];
                const simData = draw.simulationData;

                return (
                  <div key={draw.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900">{draw.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[draw.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[draw.status] || draw.status}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {draw.drawType === "ALGORITHMIC" ? <><Zap size={11} /> Algorithmic</> : <><Shuffle size={11} /> Random</>}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {MONTH_NAMES[draw.drawMonth]} {draw.drawYear} · {draw._count?.entries ?? 0} entries · {draw._count?.wins ?? 0} winners
                        </p>
                        {draw.drawnNumbers?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {draw.drawnNumbers.map((n) => (
                              <span key={n} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">{n}</span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                          <span>🏆 Jackpot: ₹{Number(draw.jackpotPool).toFixed(0)}</span>
                          <span>4-match: ₹{Number(draw.fourMatchPool).toFixed(0)}</span>
                          <span>3-match: ₹{Number(draw.threeMatchPool).toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {/* Step 1: DRAFT → OPEN (users can now enter) */}
                        {draw.status === "DRAFT" && (
                          <button
                            onClick={() => handleOpenForEntries(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Users size={14} />
                            {loading === "opening" ? "Opening…" : "Open for Entries"}
                          </button>
                        )}
                        {/* Close entries (OPEN → DRAFT) */}
                        {draw.status === "OPEN" && (
                          <button
                            onClick={() => handleOpenForEntries(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                          >
                            <Users size={14} />
                            {loading === "opening" ? "Updating…" : "Close Entries"}
                          </button>
                        )}
                        {/* Step 2: Simulate (any non-published) */}
                        {(draw.status === "DRAFT" || draw.status === "OPEN" || draw.status === "SIMULATED") && (
                          <button
                            onClick={() => handleSimulate(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            <PlayCircle size={14} />
                            {loading === "simulating" ? "Simulating…" : "Simulate"}
                          </button>
                        )}
                        {/* Step 3: Publish */}
                        {draw.status === "SIMULATED" && (
                          <button
                            onClick={() => handlePublish(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            <Send size={14} />
                            {loading === "publishing" ? "Publishing…" : "Publish Results"}
                          </button>
                        )}
                        {draw.status !== "PUBLISHED" && draw.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            {loading === "cancelling" ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                        {(draw.status === "DRAFT" || draw.status === "CANCELLED") && (
                          <button
                            onClick={() => handleDelete(draw)}
                            disabled={!!loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {loading === "deleting" ? "Deleting…" : "Delete"}
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : draw.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Details {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded simulation data */}
                    {isExpanded && simData && (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                        <p className="font-semibold text-gray-800 mb-3">Last Simulation Results</p>
                        {["FIVE_MATCH", "FOUR_MATCH", "THREE_MATCH"].map((tier) => {
                          const winners = simData.winnersByTier?.[tier] || [];
                          const prize = simData.prizePerWinner?.[tier] || 0;
                          return (
                            <div key={tier} className="mb-2">
                              <span className="font-medium text-gray-700">
                                {tier === "FIVE_MATCH" ? "5-number (Jackpot)" : tier === "FOUR_MATCH" ? "4-number" : "3-number"}: {" "}
                              </span>
                              <span className="text-gray-600">
                                {winners.length} winner{winners.length !== 1 ? "s" : ""} · ₹{prize.toFixed(0)} each
                              </span>
                            </div>
                          );
                        })}
                        {simData.jackpotRolledOver && (
                          <p className="mt-2 text-amber-700 font-medium">⚠️ No jackpot winner — prize rolls over to next draw</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Winners management link */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Winners Management</h2>
          <p className="mt-1 text-sm text-gray-600">Review winner verification submissions and track payouts.</p>
          <Link
            to="/admin/winners"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            <Trophy size={15} /> Manage Winners →
          </Link>
        </div>
      </div>
    </div>
  );
}
