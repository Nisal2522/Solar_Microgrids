// -----------------------------------------------------------------------------
// File: ProtectedRoute.jsx
// Purpose: Route guard — redirects to /login when no session exists, and shows
//          a styled "not authorised" screen when the signed-in role is not
//          allowed on that route.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldIcon } from "./ui/Icons";
import Button from "./ui/Button";

// Renders children only for an authenticated, role-permitted user.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_1px_2px_rgb(15_23_42/0.04),0_18px_40px_-18px_rgb(15_23_42/0.25)]">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
            <ShieldIcon className="h-7 w-7" />
          </span>
          <h2 className="font-display text-xl font-bold text-slate-900">Not authorised</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Your {user.userType} account doesn't have access to this area of the console.
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button variant="subtle">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
