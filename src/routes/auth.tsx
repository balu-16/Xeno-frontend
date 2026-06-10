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
    onSuccess: async (result) => {
      queryClient.setQueryData(["auth", "me"], result);
      await navigate({ to: "/dashboard" });
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
  };

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
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {mode === "login"
              ? "Sign in to your Xeno Mini marketing workspace."
              : "Get started with Xeno Mini marketing workspace."}
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
                mode === "login"
                  ? "Enter your password"
                  : "Min. 8 characters"
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

            <button
              type="submit"
              disabled={activeMutation.isPending}
              className="group w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {activeMutation.isPending
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-indigo-600 font-medium hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
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
