
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800">
            <Trophy size={20} />
          </span>
          <span className="text-xl font-bold">
            good<span className="text-emerald-400">round</span>
          </span>
        </Link>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-100/80">
          <Link to="/membership" className="hover:text-white">Membership</Link>
          <Link to="/charities" className="hover:text-white">Charities</Link>
          <Link to="/login" className="hover:text-white">Log in</Link>
        </div>

        <p className="text-sm text-emerald-100/60">
          © {new Date().getFullYear()} GoodRound
        </p>
      </div>
    </footer>
  );
}
