// -----------------------------------------------------------------------------
// File: LoginPage.jsx
// Purpose: Split-screen sign-in for Backoffice and Grid Operator staff — a
//          branded aurora panel on the left, the credential form on the right.
//          Redirects to the role-appropriate landing page on success.
// Module owner: Member A (Identity & Access)
// -----------------------------------------------------------------------------
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { AlertIcon, BatteryIcon, ShieldIcon, SunIcon } from "../components/ui/Icons";

const HIGHLIGHTS = [
  { icon: SunIcon, title: "Live grid visibility", copy: "Track every microgrid node, battery slot and booking in one console." },
  { icon: BatteryIcon, title: "Controlled energy trading", copy: "7-day booking window and 12-hour change rules enforced server-side." },
  { icon: ShieldIcon, title: "Verified transfers", copy: "Signed QR tokens confirm every prosumer hand-off at the station." },
];

// Renders the branded sign-in experience.
export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Submits credentials and routes by the role the API returns.
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const profile = await login(identifier, password);
      navigate(profile.userType === "Backoffice" ? "/" : "/operator");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="bg-aurora relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_14px_30px_-10px_rgb(16_185_129/0.9)]">
              <img src="/logo.png" alt="Smart Solar Microgrid logo" className="h-10 w-10 object-contain" />
            </span>
            <span>
              <span className="block font-display text-base font-extrabold leading-tight text-white">Solar Microgrid</span>
              <span className="block text-[11px] font-medium tracking-wide text-white/45">Trading Console</span>
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="font-display text-[44px] font-extrabold leading-[1.08] tracking-tight text-white xl:text-[52px]">
              Trade stored sunlight
              <span className="block bg-gradient-to-r from-brand-300 via-brand-200 to-solar-300 bg-clip-text text-transparent">
                across the grid.
              </span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-white/60">
              The operations console for backoffice teams and grid operators managing solar microgrid
              nodes, prosumer accounts and energy slot reservations.
            </p>

            <div className="mt-10 space-y-5">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">
                    <h.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{h.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">{h.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-9 lg:hidden">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img src="/logo.png" alt="Smart Solar Microgrid logo" className="h-11 w-11 object-contain" />
            </span>
          </div>

          <h2 className="font-display text-[30px] font-extrabold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-2 text-[15px] text-slate-500">
            Sign in to the Backoffice &amp; Grid Operator console.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[13px] font-medium text-rose-700">{error}</p>
              </div>
            )}

            <Field label="Username" required>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
                required
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to console"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
