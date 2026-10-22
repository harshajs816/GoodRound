
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Trophy,
  CalendarDays,
  Target,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import api from "../lib/api";

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const dateString = getDateInputValue(value);
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return "Date unavailable";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GolfScores() {
  const queryClient = useQueryClient();
  const today = getLocalDate();

  const [score, setScore] = useState("");
  const [date, setDate] = useState(today);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingRound, setEditingRound] = useState(null);
  const [editScore, setEditScore] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editError, setEditError] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [deletingRound, setDeletingRound] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const scoresQuery = useQuery({
    queryKey: ["my-golf-scores"],
    queryFn: async () => {
      const response = await api.get("/golf-scores/my");
      return response.data;
    },
  });

  const roundsData = scoresQuery.data;
  const rounds = Array.isArray(roundsData)
    ? roundsData
    : roundsData?.golfScores ?? roundsData?.scores ?? [];

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/golf-scores", payload);
      return response.data;
    },
    onSuccess: async () => {
      setMessage("Your golf score has been saved successfully.");
      setErrorMessage("");
      setScore("");
      setDate(today);
      await queryClient.invalidateQueries({
        queryKey: ["my-golf-scores"],
      });
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to save your score. Please try again."
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, score, scoreDate }) => {
      const response = await api.patch(`/golf-scores/${id}`, {
        score,
        scoreDate,
      });
      return response.data;
    },
    onSuccess: async () => {
      setEditMessage("Golf score updated successfully.");
      setEditError("");
      setEditingRound(null);
      await queryClient.invalidateQueries({
        queryKey: ["my-golf-scores"],
      });
    },
    onError: (error) => {
      setEditError(
        error.response?.data?.message ||
          "Unable to update this score. Please try again."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/golf-scores/${id}`);
      return response.data;
    },
    onSuccess: async () => {
      setDeletingRound(null);
      setDeleteError("");
      setMessage("Golf score deleted successfully.");
      setErrorMessage("");
      await queryClient.invalidateQueries({
        queryKey: ["my-golf-scores"],
      });
    },
    onError: (error) => {
      setDeleteError(
        error.response?.data?.message ||
          "Unable to delete this score. Please try again."
      );
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const numericScore = Number(score);

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 45
    ) {
      setErrorMessage(
        "Enter a valid Stableford score between 1 and 45."
      );
      return;
    }

    if (!date || date > today) {
      setErrorMessage(
        "Please select a valid date that is not in the future."
      );
      return;
    }

    submitMutation.mutate({
      score: numericScore,
      scoreDate: date,
    });
  };

  const openEditModal = (round) => {
    setEditingRound(round);
    setEditScore(String(round.score));
    setEditDate(
      getDateInputValue(round.scoreDate ?? round.date)
    );
    setEditError("");
    setEditMessage("");
  };

  const handleEdit = (event) => {
    event.preventDefault();
    setEditError("");
    setEditMessage("");

    const numericScore = Number(editScore);

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 1 ||
      numericScore > 45
    ) {
      setEditError("Score must be a whole number between 1 and 45.");
      return;
    }

    if (!editDate || editDate > today) {
      setEditError("Please select a valid date that is not in the future.");
      return;
    }

    if (!editingRound?.id) {
      setEditError("Could not identify this score. Refresh and try again.");
      return;
    }

    editMutation.mutate({
      id: editingRound.id,
      score: numericScore,
      scoreDate: editDate,
    });
  };

  const handleDelete = () => {
    if (!deletingRound?.id) {
      setDeleteError("Could not identify this score. Refresh and try again.");
      return;
    }

    setDeleteError("");
    deleteMutation.mutate(deletingRound.id);
  };

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            YOUR GOLF JOURNEY
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-4xl">
            Golf scores
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Record your Stableford rounds and keep your latest five scores in one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-emerald-950 p-6 text-white shadow-lg sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Target size={25} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Record a round</h2>
                <p className="mt-1 text-sm text-emerald-100/75">
                  Enter your score and round date.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block text-sm font-semibold text-emerald-50">
                Stableford score
                <input
                  type="number"
                  min="1"
                  max="45"
                  step="1"
                  required
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  placeholder="Enter score (1–45)"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3.5 text-slate-900 outline-none focus:ring-4 focus:ring-emerald-300/30"
                />
              </label>

              <label className="block text-sm font-semibold text-emerald-50">
                Round date
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-white/15 bg-white px-4 text-slate-700">
                  <CalendarDays size={19} className="shrink-0 text-emerald-800" />
                  <input
                    type="date"
                    required
                    max={today}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3.5 outline-none"
                  />
                </span>
              </label>

              {errorMessage && (
                <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm text-red-800">
                  {errorMessage}
                </p>
              )}

              {message && (
                <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-950">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 font-extrabold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitMutation.isPending ? "Saving score..." : "Save golf score"}
                {!submitMutation.isPending && <ArrowRight size={18} />}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-emerald-950">
                  Your latest rounds
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your five most recent recorded scores
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Trophy size={24} />
              </div>
            </div>

            {scoresQuery.isPending ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Loading your scores...
              </p>
            ) : scoresQuery.isError ? (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                Could not load scores. Please refresh the page or log in again.
                <button
                  onClick={() => scoresQuery.refetch()}
                  className="mt-2 block font-bold underline"
                >
                  Try again
                </button>
              </div>
            ) : rounds.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <div className="mx-auto w-fit rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                  <Trophy size={28} />
                </div>
                <h3 className="mt-4 font-bold text-emerald-950">
                  Your first round starts here
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Save a golf score to start building your history.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {rounds.slice(0, 5).map((round, index) => (
                  <div
                    key={round.id ?? `${round.scoreDate ?? round.date}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-extrabold text-emerald-800">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">Golf round</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(round.scoreDate ?? round.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-emerald-950">
                          {round.score}
                        </p>
                        <p className="text-xs font-medium text-slate-500">points</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(round)}
                          title="Edit score"
                          aria-label="Edit score"
                          className="rounded-lg border border-emerald-100 p-2 text-emerald-800 transition hover:bg-emerald-50"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingRound(round);
                            setDeleteError("");
                          }}
                          title="Delete score"
                          aria-label="Delete score"
                          className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Scores must be between 1 and 45. One score per date.
        </p>
      </div>

      {editingRound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !editMutation.isPending) {
              setEditingRound(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-score-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-score-title" className="text-xl font-extrabold text-emerald-950">
                Edit golf score
              </h2>
              <button
                type="button"
                disabled={editMutation.isPending}
                onClick={() => setEditingRound(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close edit dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Stableford score
                <input
                  type="number"
                  min="1"
                  max="45"
                  step="1"
                  required
                  value={editScore}
                  onChange={(event) => setEditScore(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Round date
                <input
                  type="date"
                  required
                  max={today}
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {editError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {editError}
                </p>
              )}

              {editMessage && (
                <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  {editMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={editMutation.isPending}
                  onClick={() => setEditingRound(null)}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="flex-1 rounded-full bg-emerald-950 px-4 py-3 font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
                >
                  {editMutation.isPending ? "Updating..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deletingRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-score-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={25} />
            </div>
            <h2 id="delete-score-title" className="mt-4 text-center text-xl font-extrabold text-slate-900">
              Delete this score?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-600">
              You are about to delete the score of{" "}
              <strong>{deletingRound.score} points</strong> recorded on{" "}
              <strong>
                {formatDate(deletingRound.scoreDate ?? deletingRound.date)}
              </strong>
              . This action cannot be undone.
            </p>

            {deleteError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setDeletingRound(null)}
                className="flex-1 rounded-full border border-slate-200 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                className="flex-1 rounded-full bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
