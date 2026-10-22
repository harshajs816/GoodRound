
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Heart,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  X,
} from "lucide-react";
import api from "../lib/api";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  websiteUrl: "",
  contactEmail: "",
};

export default function CharityManagement() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  async function fetchCharities() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/charities/admin/all");
      setCharities(response.data.charities || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load charities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCharities();
  }, []);

  const stats = useMemo(
    () => ({
      total: charities.length,
      verified: charities.filter((c) => c.isVerified && c.isActive).length,
      pending: charities.filter((c) => !c.isVerified && c.isActive).length,
      inactive: charities.filter((c) => !c.isActive).length,
    }),
    [charities]
  );

  const filteredCharities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return charities.filter((charity) => {
      const matchesSearch =
        charity.name?.toLowerCase().includes(query) ||
        charity.slug?.toLowerCase().includes(query) ||
        charity.contactEmail?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "VERIFIED" && charity.isVerified && charity.isActive) ||
        (filter === "PENDING" && !charity.isVerified && charity.isActive) ||
        (filter === "INACTIVE" && !charity.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [charities, search, filter]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "slug"
          ? value.toLowerCase().trim().replace(/\s+/g, "-")
          : value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
      };

      const response = await api.post("/charities", payload);

      if (response.data.charity) {
        setCharities((current) => [
          response.data.charity,
          ...current,
        ]);
      } else {
        await fetchCharities();
      }

      setForm(emptyForm);
      setShowForm(false);
      setNotice("Charity added successfully. It is awaiting verification.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create charity. Please check your details."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(charity) {
    const confirmed = window.confirm(
      `Verify "${charity.name}"? It will become eligible to appear in the public directory if active.`
    );

    if (!confirmed) return;

    try {
      setVerifyingId(charity.id);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/charities/${charity.id}/verify`
      );

      const updated = response.data.charity;

      setCharities((current) =>
        current.map((item) =>
          item.id === charity.id
            ? { ...item, ...updated }
            : item
        )
      );

      setNotice(response.data.message || "Charity verified successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not verify this charity."
      );
    } finally {
      setVerifyingId(null);
    }
  }

  
async function handleStatusToggle(charity) {
  const nextIsActive = !charity.isActive;

  const confirmed = window.confirm(
    `${nextIsActive ? "Activate" : "Deactivate"} "${charity.name}"? ${
      nextIsActive
        ? "It can appear in the public directory if verified."
        : "It will be hidden from the public directory."
    }`
  );

  if (!confirmed) return;

  try {
    setUpdatingStatusId(charity.id);
    setError("");
    setNotice("");

    const response = await api.patch(
      `/charities/${charity.id}/status`,
      { isActive: nextIsActive }
    );

    const updated = response.data.charity;

    setCharities((current) =>
      current.map((item) =>
        item.id === charity.id
          ? { ...item, ...updated }
          : item
      )
    );

    setNotice(
      response.data.message ||
        `Charity ${nextIsActive ? "activated" : "deactivated"} successfully.`
    );
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Could not update charity status. Please try again."
    );
  } finally {
    setUpdatingStatusId(null);
  }
}


  function statusFor(charity) {
    if (!charity.isActive) {
      return {
        label: "Inactive",
        className: "bg-gray-100 text-gray-700",
      };
    }

    if (charity.isVerified) {
      return {
        label: "Verified",
        className: "bg-emerald-100 text-emerald-800",
      };
    }

    return {
      label: "Pending",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
        >
          <ArrowLeft size={17} />
          Back to Admin Dashboard
        </Link>

        <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-green-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wider text-green-200">
              GOODROUND ADMINISTRATION
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Charity Management
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">
              Manage charity listings, review verification status and
              maintain the public charity directory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setNotice("");
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-950 transition hover:bg-green-50"
          >
            <Plus size={19} />
            Add Charity
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <XCircle size={19} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle size={19} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Charities",
              value: stats.total,
              icon: Heart,
              color: "text-slate-700",
              bg: "bg-slate-100",
            },
            {
              label: "Verified & Active",
              value: stats.verified,
              icon: CheckCircle,
              color: "text-emerald-700",
              bg: "bg-emerald-100",
            },
            {
              label: "Pending Verification",
              value: stats.pending,
              icon: Clock,
              color: "text-amber-700",
              bg: "bg-amber-100",
            },
            {
              label: "Inactive Charities",
              value: stats.inactive,
              icon: XCircle,
              color: "text-gray-600",
              bg: "bg-gray-100",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>
                  <span className={`rounded-xl p-2 ${item.bg} ${item.color}`}>
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Charity
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  New charities remain unverified until approved.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Charity Name *
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    maxLength={150}
                    placeholder="e.g. Green Earth Foundation"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    URL Slug *
                  </span>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={updateField}
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    title="Use lowercase letters, numbers and single hyphens."
                    placeholder="green-earth-foundation"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Lowercase letters, numbers and hyphens only.
                  </span>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Description *
                  </span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    required
                    maxLength={3000}
                    rows={4}
                    placeholder="Describe the charity's mission and impact..."
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Website URL
                  </span>
                  <input
                    name="websiteUrl"
                    type="url"
                    value={form.websiteUrl}
                    onChange={updateField}
                    placeholder="https://example.org"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Contact Email
                  </span>
                  <input
                    name="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={updateField}
                    placeholder="contact@example.org"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Image URL
                  </span>
                  <input
                    name="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={updateField}
                    placeholder="https://example.org/charity-image.jpg"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Charity"}
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  All Charities
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review and manage charity listings.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCharities}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, slug or email..."
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-emerald-700"
                aria-label="Filter charities by status"
              >
                <option value="ALL">All charities</option>
                <option value="VERIFIED">Verified & active</option>
                <option value="PENDING">Pending verification</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading charities...
            </div>
          ) : filteredCharities.length === 0 ? (
            <div className="p-12 text-center">
              <Heart size={36} className="mx-auto mb-3 text-gray-300" />
              <h3 className="font-semibold text-gray-800">
                No charities found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or add a new charity.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Charity</th>
                    <th className="px-5 py-4 font-semibold">Contact</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCharities.map((charity) => {
                    const status = statusFor(charity);

                    return (
                      <tr
                        key={charity.id}
                        className="align-top hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {charity.imageUrl ? (
                              <img
                                src={charity.imageUrl}
                                alt=""
                                loading="lazy"
                                className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                                <Heart size={21} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">
                                {charity.name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                /{charity.slug}
                              </p>
                              <p className="mt-2 max-w-sm whitespace-normal text-xs leading-5 text-gray-500">
                                {charity.description}
                              </p>
                              {charity.websiteUrl && (
                                <a
                                  href={charity.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                                >
                                  Website <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {charity.contactEmail || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {charity.createdAt
                            ? new Date(charity.createdAt).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        
<td className="px-5 py-4">
  <div className="flex flex-col items-start gap-2">
    {!charity.isVerified && charity.isActive && (
      <button
        type="button"
        onClick={() => handleVerify(charity)}
        disabled={
          verifyingId === charity.id ||
          updatingStatusId === charity.id
        }
        className="whitespace-nowrap rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
      >
        {verifyingId === charity.id
          ? "Verifying..."
          : "Verify Charity"}
      </button>
    )}

    {charity.isVerified && (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <CheckCircle size={15} />
        Verified
      </span>
    )}

    <button
      type="button"
      onClick={() => handleStatusToggle(charity)}
      disabled={
        updatingStatusId === charity.id ||
        verifyingId === charity.id
      }
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
        charity.isActive
          ? "bg-red-600 hover:bg-red-700"
          : "bg-emerald-700 hover:bg-emerald-800"
      }`}
    >
      {updatingStatusId === charity.id
        ? "Updating..."
        : charity.isActive
          ? "Deactivate"
          : "Activate"}
    </button>
  </div>
</td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
            Showing {filteredCharities.length} of {charities.length} charities
          </div>
        </section>
      </div>
    </div>
  );
}
