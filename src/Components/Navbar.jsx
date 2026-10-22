import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Trophy, ArrowRight, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const publicItems = [
  { label: "How it works", to: "/#how-it-works" },
  { label: "Draws", to: "/draws" },
  { label: "Charities", to: "/charities" },
];



const userItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Golf Scores", to: "/golf-scores" },
  { label: "Draws", to: "/draws" },
  { label: "Membership Plans", to: "/membership" },
  { label: "My Membership", to: "/my-membership" },
  { label: "Charities", to: "/charities" },
];

const adminItems = [
  { label: "Admin Dashboard", to: "/admin" },
  { label: "User Management", to: "/admin/users" },
  { label: "Charity Management", to: "/admin/charities" },
  { label: "Draw Management", to: "/admin/draws" },
  { label: "Winners", to: "/admin/winners" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";

  const navItems = isAdmin
    ? adminItems
    : isAuthenticated
      ? userItems
      : publicItems;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition hover:text-emerald-800 ${
      isActive ? "text-emerald-800" : "text-slate-600"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          to={isAdmin ? "/admin" : "/"}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-emerald-950"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Trophy size={21} />
          </span>
          good<span className="-ml-2 text-emerald-600">round</span>
          {isAdmin && (
            <span className="ml-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
              ADMIN
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={linkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Get started <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              {!isAdmin && (
                <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <UserCircle size={19} />
                  {user?.name || "My Account"}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-800/20 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-emerald-950 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50"
              >
                {item.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-full bg-emerald-800 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}