
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Users, RefreshCw } from "lucide-react";
import api from "../lib/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [users, search]);

  async function toggleStatus(user) {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");

      const response = await api.patch(
        `/admin/users/${user.id}/status`,
        { isActive: nextStatus }
      );

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? response.data.user : item
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update user status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <div className="mb-8 rounded-2xl bg-green-900 p-7 text-white sm:p-8">
          <p className="mb-2 text-sm font-medium text-green-200">
            GOODROUND ADMINISTRATION
          </p>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="mt-2 text-green-100">
            Review registered users and manage account status.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactive Users</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {users.length - activeCount}
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Registered Users
          </h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-gray-500">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="font-semibold text-gray-800">No users found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try a different name or email.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {user.name}
                      </p>
                      <p className="mt-1 text-gray-500">{user.email}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
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

                    <td className="px-5 py-4">
                      {user.role === "ADMIN" ? (
                        <span className="text-xs text-gray-400">
                          Protected admin
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === user.id}
                          onClick={() => toggleStatus(user)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                            user.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {updatingId === user.id
                            ? "Updating..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} users.
        </p>
      </div>
    </div>
  );
}
