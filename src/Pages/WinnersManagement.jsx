import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Search,
  DollarSign,
} from "lucide-react";
import api from "../lib/api";

const PAYOUT_COLORS = {
  PENDING: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
};

const MATCH_LABELS = {
  FIVE_MATCH: "5-Number (Jackpot)",
  FOUR_MATCH: "4-Number",
  THREE_MATCH: "3-Number",
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function WinnersManagement() {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState({});

  async function fetchWins() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/draws/admin/winners");
      setWins(res.data.wins || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load winners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWins(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wins.filter((w) => {
      const matchesSearch = !q ||
        w.user?.name?.toLowerCase().includes(q) ||
        w.user?.email?.toLowerCase().includes(q) ||
        w.draw?.title?.toLowerCase().includes(q);
      const matchesFilter = filter === "ALL" || w.payoutStatus === filter;
      return matchesSearch && matchesFilter;
    });
  }, [wins, search, filter]);

  async function handleVerify(win, payoutStatus) {
    const label = payoutStatus === "VERIFIED" ? "verify" : "reject";
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this winner?`)) return;
    try {
      setActionLoading((p) => ({ ...p, [win.id]: payoutStatus }));
      setError(""); setNotice("");
      await api.patch(`/draws/admin/winners/${win.id}/verify`, { payoutStatus });
      setNotice(`Winner ${label === "verify" ? "verified" : "rejected"}.`);
      await fetchWins();
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${label} winner.`);
    } finally {
      setActionLoading((p) => ({ ...p, [win.id]: null }));
    }
  }

  async function handleMarkPaid(win) {
    if (!window.confirm("Mark this winner as paid?")) return;
    try {
      setActionLoading((p) => ({ ...p, [win.id]: "PAID" }));
      setError(""); setNotice("");
      await api.patch(`/draws/admin/winners/${win.id}/pay`);
      setNotice("Winner marked as paid.");
      await fetchWins();
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark as paid.");
    } finally {
      setActionLoading((p) => ({ ...p, [win.id]: null }));
    }
  }

  const stats = useMemo(() => ({
    total: wins.length,
    pending: wins.filter((w) => w.payoutStatus === "PENDING").length,
    verified: wins.filter((w) => w.payoutStatus === "VERIFIED").length,
    paid: wins.filter((w) => w.payoutStatus === "PAID").length,
  }), [wins]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin/draws" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
          <ArrowLeft size={17} /> Back to Draw Management
        </Link>

        <header className="mb-8 rounded-2xl bg-emerald-950 p-6 text-white sm:p-8">
          <p className="mb-2 text-sm font-semibold tracking-wider text-emerald-300">GOODROUND ADMINISTRATION</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Winners Management</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">
            Review winner submissions, verify proof of score, and mark payouts as completed.
          </p>
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
            { label: "Total Winners", value: stats.total, color: "text-slate-700" },
            { label: "Pending Review", value: stats.pending, color: "text-amber-700" },
            { label: "Verified", value: stats.verified, color: "text-blue-700" },
            { label: "Paid Out", value: stats.paid, color: "text-emerald-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <p className={`mt-3 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Winners table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Winners</h2>
                <p className="mt-1 text-sm text-gray-500">{filtered.length} of {wins.length} records</p>
              </div>
              <button onClick={fetchWins} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or draw…"
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-emerald-700">
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading winners…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-800">No winners found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Winner</th>
                    <th className="px-5 py-4 font-semibold">Draw</th>
                    <th className="px-5 py-4 font-semibold">Match</th>
                    <th className="px-5 py-4 font-semibold">Prize</th>
                    <th className="px-5 py-4 font-semibold">Proof</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((win) => {
                    const busy = actionLoading[win.id];
                    return (
                      <tr key={win.id} className="align-top hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{win.user?.name}</p>
                          <p className="text-xs text-gray-500">{win.user?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-800">{win.draw?.title}</p>
                          <p className="text-xs text-gray-500">
                            {win.draw ? `${MONTH_NAMES[win.draw.drawMonth]} ${win.draw.drawYear}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-700">
                          {MATCH_LABELS[win.matchType] || win.matchType}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-800">
                          ₹{Number(win.prizeAmount).toFixed(0)}
                        </td>
                        <td className="px-5 py-4">
                          {win.proofImageUrl ? (
                            <a href={win.proofImageUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-medium text-emerald-700 hover:underline">
                              View proof ↗
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Not submitted</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${PAYOUT_COLORS[win.payoutStatus] || ""}`}>
                            {win.payoutStatus === "PENDING" && <Clock size={11} />}
                            {win.payoutStatus === "VERIFIED" && <CheckCircle size={11} />}
                            {win.payoutStatus === "PAID" && <DollarSign size={11} />}
                            {win.payoutStatus === "REJECTED" && <XCircle size={11} />}
                            {win.payoutStatus}
                          </span>
                          {win.adminNote && <p className="mt-1 text-xs text-gray-500">{win.adminNote}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            {win.payoutStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleVerify(win, "VERIFIED")}
                                  disabled={!!busy}
                                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {busy === "VERIFIED" ? "Verifying…" : "Verify"}
                                </button>
                                <button
                                  onClick={() => handleVerify(win, "REJECTED")}
                                  disabled={!!busy}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {busy === "REJECTED" ? "Rejecting…" : "Reject"}
                                </button>
                              </>
                            )}
                            {win.payoutStatus === "VERIFIED" && (
                              <button
                                onClick={() => handleMarkPaid(win)}
                                disabled={!!busy}
                                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                              >
                                {busy === "PAID" ? "Updating…" : "Mark Paid"}
                              </button>
                            )}
                            {(win.payoutStatus === "PAID" || win.payoutStatus === "REJECTED") && (
                              <span className="text-xs text-gray-400">No action</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
