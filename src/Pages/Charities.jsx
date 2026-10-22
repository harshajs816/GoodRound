
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  HeartHandshake,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
  ArrowUpRight,
} from "lucide-react";
import api from "../lib/api";

export default function Charities() {
  const charitiesQuery = useQuery({
    queryKey: ["charities"],
    queryFn: async () => {
      const response = await api.get("/charities");
      return response.data;
    },
  });

  const responseData = charitiesQuery.data;
  const charities = Array.isArray(responseData)
    ? responseData
    : responseData?.charities ?? [];

  return (
    <main className="min-h-screen bg-[#f5f8f3]">
      <section className="bg-emerald-950 px-5 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <HeartHandshake size={30} />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
            PURPOSE IN EVERY ROUND
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Play with purpose.
            <span className="block text-emerald-300">
              Make an impact.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
            Discover verified charitable organisations and learn about
            the causes working to create a positive impact in communities.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <ShieldCheck size={17} />
              Verified organisations
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <Heart size={17} />
              Purpose-driven giving
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
              OUR CHARITY PARTNERS
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-emerald-950 sm:text-3xl">
              Explore our charities
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              Learn about the organisations in our directory and the causes
              they support.
            </p>
          </div>

          {!charitiesQuery.isPending && !charitiesQuery.isError && (
            <span className="w-fit rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">
              {charities.length} verified{" "}
              {charities.length === 1 ? "charity" : "charities"}
            </span>
          )}
        </div>

        {charitiesQuery.isPending ? (
          <div className="grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl border border-slate-100 bg-white p-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                <div className="mt-5 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
                <div className="mt-6 h-9 w-28 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : charitiesQuery.isError ? (
          <div className="mt-8 rounded-3xl border border-red-100 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <RefreshCw size={26} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              We couldn't load the charities
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => charitiesQuery.refetch()}
              className="mt-5 rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
            >
              Try again
            </button>
          </div>
        ) : charities.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
              <HeartHandshake size={30} />
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-emerald-950">
              Our directory is growing
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              There are no verified charities available yet. Please check back
              soon as new organisations are added and reviewed.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {charities.map((charity) => (
              <article
                key={charity.id}
                className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <HeartHandshake size={27} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck size={14} />
                    Verified
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-emerald-950">
                  {charity.name}
                </h3>

                <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {charity.description ||
                    "Learn more about this organisation and its charitable work."}
                </p>

                {(charity.city || charity.location || charity.address) && (
                  <p className="mt-4 flex items-start gap-2 text-sm text-slate-500">
                    <MapPin size={17} className="mt-0.5 shrink-0" />
                    <span>
                      {charity.city ||
                        charity.location ||
                        charity.address}
                    </span>
                  </p>
                )}

                {charity.website && (
                  <a
                    href={charity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    Visit website
                    <ArrowUpRight size={16} />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Users size={27} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-emerald-950">
                Every contribution can make a difference
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Explore our charity partners and learn how GoodRound aims
                to connect golf participation with charitable impact.
                Donations and their distribution should be confirmed through
                the platform's verified donation records.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
