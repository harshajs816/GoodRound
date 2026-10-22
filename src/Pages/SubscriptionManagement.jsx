
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Layers,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  X,
  IndianRupee,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import api from "../lib/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  billingInterval: "MONTHLY",
  price: "",
  currency: "INR",
};

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function fetchPlans() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/subscriptions/admin/plans");
      setPlans(response.data.plans || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load subscription plans. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.isActive).length,
      inactive: plans.filter((plan) => !plan.isActive).length,
      monthly: plans.filter(
        (plan) => plan.billingInterval === "MONTHLY"
      ).length,
      yearly: plans.filter(
        (plan) => plan.billingInterval === "YEARLY"
      ).length,
    }),
    [plans]
  );

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        plan.name?.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query) ||
        plan.billingInterval?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && plan.isActive) ||
        (filter === "INACTIVE" && !plan.isActive) ||
        (filter === "MONTHLY" &&
          plan.billingInterval === "MONTHLY") ||
        (filter === "YEARLY" &&
          plan.billingInterval === "YEARLY");

      return matchesSearch && matchesFilter;
    });
  }, [plans, search, filter]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "currency" ? value.toUpperCase() : value,
    }));
  }

  function openCreateForm() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      description: plan.description || "",
      billingInterval: plan.billingInterval,
      price: String(plan.price ?? ""),
      currency: plan.currency || "INR",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const currency = form.currency.trim().toUpperCase();

    if (!name) {
      setError("Plan name is required.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Enter a valid non-negative price.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      setError("Enter a valid 3-letter currency code, such as INR.");
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      billingInterval: form.billingInterval,
      price,
      currency,
    };

    try {
      setSaving(true);
      setError("");
      setNotice("");

      let response;

      if (editingPlan) {
        response = await api.patch(
          `/subscriptions/admin/plans/${editingPlan.id}`,
          payload
        );

        const updatedPlan = response.data.plan;

        setPlans((current) =>
          current.map((plan) =>
            plan.id === editingPlan.id
              ? { ...plan, ...updatedPlan }
              : plan
          )
        );

        setNotice(
          response.data.message || "Subscription plan updated successfully."
        );
      } else {
        response = await api.post(
          "/subscriptions/admin/plans",
          payload
        );

        const newPlan = response.data.plan;

        if (newPlan) {
          setPlans((current) => [
            newPlan,
            ...current.filter((plan) => plan.id !== newPlan.id),
          ]);
        } else {
          await fetchPlans();
        }

        setNotice(
          response.data.message || "Subscription plan created successfully."
        );
      }

      setShowForm(false);
      setEditingPlan(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not ${editingPlan ? "update" : "create"} the plan.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle(plan) {
    const nextIsActive = !plan.isActive;

    const confirmed = window.confirm(
      `${nextIsActive ? "Activate" : "Deactivate"} "${plan.name}"? ${
        nextIsActive
          ? "It will become available to users."
          : "It will no longer appear in the public plans list. Existing subscriptions will not be cancelled."
      }`
    );

    if (!confirmed) return;

    try {
      setUpdatingStatusId(plan.id);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/subscriptions/admin/plans/${plan.id}/status`,
        { isActive: nextIsActive }
      );

      const updatedPlan = response.data.plan;

      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id
            ? { ...item, ...updatedPlan }
            : item
        )
      );

      setNotice(
        response.data.message ||
          `Plan ${nextIsActive ? "activated" : "deactivated"} successfully.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update the plan status."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function formatPrice(plan) {
    const amount = Number(plan.price);

    if (!Number.isFinite(amount)) {
      return `${plan.currency || "INR"} ${plan.price}`;
    }

    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: plan.currency || "INR",
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${plan.currency || "INR"} ${amount.toFixed(2)}`;
    }
  }

  function formatInterval(interval) {
    return interval === "YEARLY" ? "Yearly" : "Monthly";
  }

  const statCards = [
    {
      label: "Total Plans",
      value: stats.total,
      icon: Layers,
      iconClass: "bg-slate-100 text-slate-700",
    },
    {
      label: "Active Plans",
      value: stats.active,
      icon: CheckCircle,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Inactive Plans",
      value: stats.inactive,
      icon: XCircle,
      iconClass: "bg-red-100 text-red-700",
    },
    {
      label: "Monthly / Yearly",
      value: `${stats.monthly} / ${stats.yearly}`,
      icon: CalendarDays,
      iconClass: "bg-blue-100 text-blue-700",
    },
  ];

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
              Subscription Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">
              Create pricing plans, manage billing intervals and control
              which plans are available to users.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-950 transition hover:bg-green-50"
          >
            <Plus size={19} />
            Create Plan
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
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
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>

                  <span className={`rounded-xl p-2 ${item.iconClass}`}>
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
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingPlan
                    ? "Update the plan details. Existing subscriptions are retained."
                    : "Set the price, billing interval and description for the new plan."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Plan Name *
                  </span>

                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    maxLength={100}
                    placeholder="e.g. GoodRound Premium"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Billing Interval *
                  </span>

                  <select
                    name="billingInterval"
                    value={form.billingInterval}
                    onChange={updateField}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Price *
                  </span>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={updateField}
                      required
                      min="0"
                      step="0.01"
                      placeholder="499.00"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Currency *
                  </span>

                  <input
                    name="currency"
                    value={form.currency}
                    onChange={updateField}
                    required
                    minLength={3}
                    maxLength={3}
                    pattern="[A-Za-z]{3}"
                    title="Enter a three-letter currency code, such as INR"
                    placeholder="INR"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    maxLength={2000}
                    rows={4}
                    placeholder="Describe the benefits of this subscription plan..."
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                      ? "Save Changes"
                      : "Create Plan"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  All Subscription Plans
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage prices, billing intervals and availability.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchPlans}
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
                  placeholder="Search by plan name or description..."
                  aria-label="Search subscription plans"
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter subscription plans"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-emerald-700"
              >
                <option value="ALL">All plans</option>
                <option value="ACTIVE">Active plans</option>
                <option value="INACTIVE">Inactive plans</option>
                <option value="MONTHLY">Monthly plans</option>
                <option value="YEARLY">Yearly plans</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading subscription plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-12 text-center">
              <Layers size={36} className="mx-auto mb-3 text-gray-300" />

              <h3 className="font-semibold text-gray-800">
                No subscription plans found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Change your search or create a new subscription plan.
              </p>

              {plans.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-950"
                >
                  <Plus size={16} />
                  Create First Plan
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Plan</th>
                    <th className="px-5 py-4 font-semibold">Price</th>
                    <th className="px-5 py-4 font-semibold">Billing</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="align-top hover:bg-gray-50"
                    >
                      <td className="max-w-sm px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {plan.name}
                        </p>

                        <p className="mt-1 whitespace-normal text-xs leading-5 text-gray-500">
                          {plan.description || "No description provided"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-bold text-gray-900">
                          {formatPrice(plan)}
                        </span>

                        <span className="block mt-1 text-xs text-gray-500">
                          per {plan.billingInterval === "YEARLY" ? "year" : "month"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                          <CalendarDays size={13} />
                          {formatInterval(plan.billingInterval)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                            plan.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {plan.isActive ? (
                            <CheckCircle size={13} />
                          ) : (
                            <Clock size={13} />
                          )}

                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {plan.createdAt
                          ? new Date(plan.createdAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(plan)}
                            disabled={updatingStatusId === plan.id || saving}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Pencil size={13} />
                            Edit Plan
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusToggle(plan)}
                            disabled={
                              updatingStatusId === plan.id || saving
                            }
                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                              plan.isActive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-emerald-700 hover:bg-emerald-800"
                            }`}
                          >
                            {updatingStatusId === plan.id
                              ? "Updating..."
                              : plan.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
            Showing {filteredPlans.length} of {plans.length} plans
          </div>
        </section>
      </div>
    </div>
  );
}
