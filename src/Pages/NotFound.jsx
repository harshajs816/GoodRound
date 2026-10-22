import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">404 error</p>
      <h1 className="mt-3 text-4xl font-extrabold text-emerald-950">Page not found</h1>
      <Link to="/" className="mt-6 rounded-full bg-emerald-800 px-6 py-3 font-bold text-white">Back to home</Link>
    </section>
  );
}