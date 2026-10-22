
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const initialStats = [
  { key: "totalUsers", title: "Total Users", icon: "👥" },
  { key: "activeUsers", title: "Active Users", icon: "✅" },
  { key: "totalCharities", title: "Total Charities", icon: "❤️" },
  { key: "verifiedCharities", title: "Verified Charities", icon: "🏅" },
  { key: "activeSubscriptions", title: "Active Subscriptions", icon: "💳" },
  { key: "totalDraws", title: "Total Draws", icon: "🎯" },
  { key: "publishedDraws", title: "Published Draws", icon: "✨" },
  { key: "totalWinners", title: "Total Winners", icon: "🏆" },
  { key: "pendingPayouts", title: "Pending Payouts", icon: "⏳" },
  { key: "estimatedPrizePool", title: "Est. Prize Pool (₹)", icon: "💰" },
  { key: "estimatedCharityTotal", title: "Est. Charity Total (₹)", icon: "🌱" },
  { key: "pendingCharities", title: "Pending Verification", icon: "🔍" },
];

const adminSections = [
  {
    title: "Charity Management",
    description: "Add charities, review their details and verify eligible organizations.",
    path: "/admin/charities",
    icon: "❤️",
  },
  {
    title: "User Management",
    description: "Review registered users and their account status.",
    path: "/admin/users",
    icon: "👥",
  },
  {
    title: "Subscriptions",
    description: "Review membership plans and subscription activity.",
    path: "/admin/subscriptions",
    icon: "💳",
  },
  {
    title: "Draw Management",
    description: "Create monthly draws, run simulations and publish results.",
    path: "/admin/draws",
    icon: "🎯",
  },
  {
    title: "Winners Management",
    description: "Verify winner submissions, review proof of scores and mark payouts.",
    path: "/admin/winners",
    icon: "🏆",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/dashboard");

        if (!response.data?.success) {
          throw new Error("Dashboard data could not be loaded.");
        }

        if (isMounted) {
          setStats(response.data.stats);
          setRecentUsers(response.data.recentUsers ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl bg-green-900 p-8 text-white">
          <p className="mb-2 text-sm font-medium text-green-200">
            GOODROUND ADMINISTRATION
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-green-100">
            Manage charities, monitor platform activity and administer
            GoodRound from one place.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Platform Overview
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="mb-6 rounded-xl bg-white p-5 text-gray-600 shadow-sm">
            Loading dashboard statistics...
          </p>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load dashboard</p>
            <p className="mt-1 text-sm">{error}</p>
            <p className="mt-2 text-sm">
              Check your login session and backend server.
            </p>
          </div>
        )}

        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {initialStats.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {item.title}
                </p>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">
                {loading ? "—" : (stats?.[item.key] ?? 0)}
              </p>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Recent Users
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <p className="p-6 text-gray-500">Loading users...</p>
            ) : recentUsers.length === 0 ? (
              <p className="p-6 text-gray-500">No users found.</p>
            ) : (
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.role}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      
<section>
  <h2 className="mb-4 text-xl font-bold text-gray-900">
    Management
  </h2>

  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    {adminSections.map((section) => (
      <div
        key={section.title}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 text-3xl">{section.icon}</div>

        <h3 className="text-lg font-semibold text-gray-900">
          {section.title}
        </h3>

        <p className="mt-2 min-h-16 text-sm leading-6 text-gray-600">
          {section.description}
        </p>

        {section.comingSoon ? (
          <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500">
            Coming soon
          </span>
        ) : (
          <Link
            to={section.path}
            className="mt-4 inline-flex rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Manage {section.title.replace(" Management", "")} →
          </Link>
        )}
      </div>
    ))}
  </div>
</section>

      </div>
    </div>
  );
}
