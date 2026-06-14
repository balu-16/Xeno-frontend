import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · Xeno Mini" }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: async (result) => {
      queryClient.setQueryData(["auth", "me"], result);
      await navigate({ to: "/dashboard" });
    },
  });

  const register = useMutation({
    mutationFn: () => api.register(name, email, password),
    onSuccess: (result) => {
      if (result.pendingApproval) {
        setPendingApproval(true);
        setPendingMessage(result.message);
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      login.mutate();
    } else {
      register.mutate();
    }
  };

  const activeMutation = mode === "login" ? login : register;
  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setName("");
    setEmail("");
    setPassword("");
    setPendingApproval(false);
    setPendingMessage("");
  };

  if (pendingApproval) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen w-screen overflow-hidden bg-white">
        {/* Left visual */}
        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-400 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0px, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.3) 0px, transparent 40%)",
            }}
          />
          <div className="absolute top-8 left-8 flex items-center gap-2 text-white">
            <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur grid place-items-center border border-white/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">Xeno Mini</span>
          </div>
        </div>

        {/* Pending approval message */}
        <div className="flex items-center justify-center px-6 py-10 bg-white">
          <div className="w-full max-w-sm text-center">
            {/* Animated clock icon */}
            <div className="mx-auto h-20 w-20 rounded-2xl bg-amber-50 border border-amber-200 grid place-items-center mb-6 relative">
              <svg
                className="h-10 w-10 text-amber-500 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Request Submitted!
            </h1>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Thank you for signing up. Your account request has been sent to the admin for review.
            </p>

            {/* Status steps */}
            <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-5 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 grid place-items-center shrink-0 mt-0.5">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Account Created</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your details have been submitted</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-amber-100 grid place-items-center shrink-0 mt-0.5 relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping absolute" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500 relative" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Awaiting Admin Approval</p>
                    <p className="text-xs text-slate-400 mt-0.5">Please wait while an admin reviews your request</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-50">
                  <div className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center shrink-0 mt-0.5">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Access Granted</p>
                    <p className="text-xs text-slate-400 mt-0.5">You'll be able to sign in after approval</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email notice */}
            <p className="mt-5 text-xs text-slate-400">
              Signed up as <span className="font-medium text-slate-600">{email}</span>
            </p>

            <button
              onClick={toggleMode}
              className="mt-6 w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Back to Sign In
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-xs text-slate-400">
              You can try signing in after your account is approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen w-screen overflow-hidden bg-white">
      {/* Left visual */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-400 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0px, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.3) 0px, transparent 40%)",
          }}
        />
        <div className="absolute top-8 left-8 flex items-center gap-2 text-white">
          <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur grid place-items-center border border-white/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">Xeno Mini</span>
        </div>

        <div className="relative w-[380px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/70">Last campaign</div>
              <div className="font-medium mt-0.5">VIP Early Access</div>
            </div>
            <div className="text-xs px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
              Live
            </div>
          </div>
          <div className="mt-5">
            <div className="text-5xl font-semibold tracking-tight">
              98.4<span className="text-2xl text-white/70">%</span>
            </div>
            <div className="text-sm text-white/70 mt-1">Delivery rate</div>
          </div>
          <div className="mt-5 h-28 flex items-end gap-1.5">
            {[40, 55, 48, 70, 62, 84, 76, 92, 88, 96, 90, 98].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-white/30 to-white/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              ["Sent", "24k"],
              ["Opened", "15.4k"],
              ["Clicked", "4.2k"],
            ].map(([l, v]) => (
              <div
                key={l}
                className="rounded-lg bg-white/10 border border-white/15 py-2"
              >
                <div className="text-white/60">{l}</div>
                <div className="font-semibold text-sm mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-8 right-8 text-white/80 text-sm">
          "We replaced three tools with Xeno Mini in a weekend." — Head of
          Growth, Lumen Coffee
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Xeno Mini</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Manager Sign Up"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {mode === "login"
              ? "Sign in to your Xeno Mini marketing workspace."
              : "Request access to manage your store. An admin will review and approve your account."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && (
              <Field
                icon={User}
                label="Full name"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
              />
            )}
            <Field
              icon={Mail}
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
            <Field
              icon={Lock}
              label="Password"
              placeholder={
                mode === "login" ? "Enter your password" : "Min. 8 characters"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />

            {activeMutation.error && (
              <p className="text-sm text-rose-600">
                {activeMutation.error.message}
              </p>
            )}

            {mode === "register" && (
              <p className="text-xs text-slate-400 -mt-2">
                Your request will be sent to an admin for approval before you can sign in.
              </p>
            )}

            <button
              type="submit"
              disabled={activeMutation.isPending}
              className="group w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {activeMutation.isPending
                ? mode === "login"
                  ? "Signing in..."
                  : "Submitting request..."
                : mode === "login"
                  ? "Sign in"
                  : "Request Access"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            {mode === "login"
              ? "Need manager access? "
              : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-indigo-600 font-medium hover:underline"
            >
              {mode === "login" ? "Request access" : "Sign in"}
            </button>
          </p>

          {mode === "login" && (
            <p className="mt-3 text-xs text-slate-400 text-center">
              Evaluator access is created by the deterministic seed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1.5 relative">
        <Icon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          {...props}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
        />
      </div>
    </label>
  );
}
