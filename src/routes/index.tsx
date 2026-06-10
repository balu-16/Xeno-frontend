import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChevronRight,
  Mail,
  Megaphone,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar — capsule shaped */}
      <nav className="sticky top-0 z-50 flex justify-center px-4 pt-3">
        <div className="flex items-center justify-between w-full max-w-4xl h-14 rounded-full bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/40 px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight">Xeno Mini</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                Features
              </a>
              <a
                href="#about"
                className="px-3.5 py-1.5 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                About
              </a>
              <a
                href="#contact"
                className="px-3.5 py-1.5 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden sm:inline-flex h-9 px-4 items-center rounded-full text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/auth"
              className="h-9 px-5 inline-flex items-center rounded-full text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.1) 0px, transparent 50%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-6 sm:mb-8">
            <Zap className="h-3 w-3" />
            B2C Marketing, Reimagined
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            The AI-native{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              marketing copilot
            </span>{" "}
            for modern brands
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Xeno Mini unifies customer segmentation, campaign orchestration, and
            AI-powered analytics in a single platform. Ship campaigns in minutes,
            not weeks.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center rounded-full text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center rounded-full text-sm sm:text-base font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              See Features <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </div>
          {/* Stats */}
          <div className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto">
            {[
              ["98.4%", "Delivery Rate"],
              ["84%", "Open Rate"],
              ["71%", "Conversion"],
              ["< 5 min", "Setup Time"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="text-center p-3 sm:p-0 rounded-xl sm:rounded-none bg-slate-50/60 sm:bg-transparent"
              >
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                grow faster
              </span>
            </h2>
            <p className="mt-3 sm:mt-4 text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
              From audience discovery to campaign delivery, Xeno Mini handles the
              entire marketing lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Users,
                title: "Smart Segmentation",
                description:
                  "Build dynamic audience segments with rule-based conditions. Target customers by spend, behavior, location, and engagement.",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Megaphone,
                title: "Campaign Orchestration",
                description:
                  "Launch multi-channel campaigns across Email, WhatsApp, SMS, and RCS. Schedule, automate, and track every message.",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                icon: Bot,
                title: "AI Copilot",
                description:
                  "Ask natural-language questions. Get grounded answers from your actual campaign data, not hallucinated metrics.",
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description:
                  "Track delivery, opens, clicks, and conversions in real-time. See campaign performance update live as events stream in.",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                icon: Target,
                title: "Audience Discovery",
                description:
                  "Find your highest-value segments automatically. The AI recommends audiences based on historical conversion patterns.",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description:
                  "JWT authentication, role-based access, httpOnly cookies, and CSRF protection. Your data never leaves your control.",
                color: "text-rose-600",
                bg: "bg-rose-50",
              },
            ].map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${bg} grid place-items-center mb-3 sm:mb-4`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
                </div>
                <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Built for{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  B2C marketers
                </span>{" "}
                who move fast
              </h2>
              <p className="mt-4 sm:mt-6 text-slate-500 text-base sm:text-lg leading-relaxed">
                Xeno Mini was designed from the ground up for direct-to-consumer
                brands. We replaced three separate tools with one unified platform
                that actually understands your business.
              </p>
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                {[
                  "No-code segment builder with live audience preview",
                  "Multi-channel campaign delivery with real-time tracking",
                  "AI copilot that answers business questions from your data",
                  "Deterministic seed data for reliable demos and testing",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-600">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-sky-400 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center border border-white/20">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">
                      Xeno AI Copilot
                    </div>
                    <div className="text-[10px] sm:text-xs text-white/70">
                      Every answer is tool-grounded
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4 border border-white/15">
                    <div className="text-xs sm:text-sm text-white/70 mb-1">
                      You asked
                    </div>
                    <div className="text-sm">Why did Summer Sale fail?</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="text-xs sm:text-sm text-white/70 mb-1">
                      AI Response
                    </div>
                    <div className="text-xs sm:text-sm leading-relaxed">
                      Summer Sale reached 60% delivery, but only 20% opened.
                      400 messages hit invalid destinations. Focus on list
                      hygiene and subject line optimization.
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-wider text-indigo-200">
                      Grounded by diagnoseCampaignFailure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            Ready to replace your marketing stack?
          </h2>
          <p className="mt-3 sm:mt-4 text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Get started in minutes. No credit card required. Full access to every
            feature.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center rounded-full text-sm sm:text-base font-medium text-slate-900 bg-white hover:bg-slate-100 transition-all"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#contact"
              className="h-11 sm:h-12 px-6 sm:px-8 inline-flex items-center justify-center rounded-full text-sm sm:text-base font-medium text-white border border-white/20 hover:bg-white/10 transition-all"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 sm:py-16 bg-slate-900 text-slate-400 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Xeno Mini</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed max-w-sm">
                The AI-native B2C marketing platform for modern brands. Unify
                segmentation, campaigns, and analytics in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">
                Product
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">
                Contact
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  hello@xenomini.com
                </li>
                <li>Bengaluru, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800 text-xs sm:text-sm text-center">
            © {new Date().getFullYear()} Xeno Mini. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
