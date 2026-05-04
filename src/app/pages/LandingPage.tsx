import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLayerGroup, 
  faUserPlus, 
  faBolt, 
  faChartSimple, 
  faLink, 
  faShieldHalved,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

const features = [
  {
    icon: faLayerGroup,
    title: 'Deal Pipeline',
    desc: 'Track every deal from first touch to close. Visual pipelines give your team clarity at every stage.',
  },
  {
    icon: faUserPlus,
    title: 'Lead Management',
    desc: 'Capture, qualify, and route leads automatically. Never miss an opportunity again.',
  },
  {
    icon: faBolt,
    title: 'Automation',
    desc: 'Set up workflows that run on autopilot — follow-ups, assignments, escalations, all handled.',
  },
  {
    icon: faChartSimple,
    title: 'Analytics',
    desc: 'Real-time dashboards and reports that help you make data-driven decisions faster.',
  },
  {
    icon: faLink,
    title: 'Integrations',
    desc: 'Connect with your existing tools — email, calendar, Slack, and hundreds more.',
  },
  {
    icon: faShieldHalved,
    title: 'Enterprise Security',
    desc: 'Role-based access, audit logs, and multi-tenant isolation built from the ground up.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-foreground/[0.02] rounded-full blur-[150px]" />
        
        {}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-lg shadow-primary/10">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">Propela</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 shadow-lg shadow-primary/10 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-8 text-sm text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Now in Beta — Join the waitlist
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
          <span className="text-foreground">
            Your deals deserve
          </span>
          <br />
          <span className="text-foreground/40">
            a better pipeline
          </span>
        </h1>

        <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed mb-10">
          Propela is the modern CRM platform that helps teams close deals faster
          with intelligent automation, real-time analytics, and a UI your team will
          actually love.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 shadow-xl shadow-primary/10 hover:-translate-y-0.5"
          >
            Start Free Trial <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
          <button className="px-8 py-3.5 text-base font-medium text-foreground/60 hover:text-foreground border border-border hover:border-foreground/20 rounded-xl transition-all duration-200 hover:bg-foreground/[0.02]">
            Watch Demo
          </button>
        </div>

        {}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-border bg-card p-1 shadow-2xl overflow-hidden">
            <div className="rounded-xl bg-muted/30 p-6 min-h-[320px] flex flex-col">
              {}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                </div>
                <div className="h-6 w-48 rounded-lg bg-foreground/[0.04]" />
                <div className="w-20" />
              </div>

              {}
              <div className="flex gap-4 mb-6">
                {[
                  { label: 'Total Deals', value: '2,847', change: '+12.5%' },
                  { label: 'Revenue', value: '$1.2M', change: '+8.2%' },
                  { label: 'Win Rate', value: '68%', change: '+3.1%' },
                  { label: 'Avg. Close', value: '14 days', change: '-2.4d' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 rounded-xl bg-card border border-border p-4 text-left"
                  >
                    <p className="text-xs text-foreground/40 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <span className="text-xs font-medium text-foreground/60">
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>

              {}
              <div className="flex-1 rounded-xl bg-card border border-border flex items-end p-4 gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="rounded-t-md bg-foreground/10 group-hover:bg-foreground/20 transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">
              Everything you need to close more deals
            </span>
          </h2>
          <p className="text-foreground/40 text-lg max-w-xl mx-auto">
            Powerful features designed for modern sales teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-2xl mb-4 group-hover:bg-foreground/10 transition-colors">
                <FontAwesomeIcon icon={f.icon} className="text-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-foreground/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-12 rounded-3xl bg-muted/50 border border-border relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Ready to accelerate your pipeline?</h2>
            <p className="text-foreground/50 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of teams already using Propela to close deals faster.
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-3.5 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 shadow-xl shadow-primary/10 hover:-translate-y-0.5"
            >
              Get Started Free <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {}
      <footer className="relative z-10 border-t border-border py-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              P
            </div>
            <span className="text-sm text-foreground/40">© 2026 Propela. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/30">
            <a href="#" className="hover:text-foreground/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
