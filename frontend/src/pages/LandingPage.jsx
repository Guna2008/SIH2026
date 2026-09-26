import { Link } from 'react-router-dom'
import { ArrowRight, Soup, Boxes, HandHeart, ShieldCheck, Clock, Scale, Sprout, } from 'lucide-react'
import PublicNav from '../components/layout/PublicNav'

const STEPS = [
  {
    n: '01',
    title: 'Kitchens log what they cook',
    body: 'Institutional kitchens track raw materials, recipes and production runs. When consumption falls short of what was produced, the surplus is captured automatically — not estimated.',
    icon: Soup,
  },
  {
    n: '02',
    title: 'The system classifies and lists it',
    body: 'Every surplus upload is timestamped and sorted into breakfast, lunch or dinner without anyone choosing a category by hand. No manual mistakes, no disputed timing.',
    icon: Boxes,
  },
  {
    n: '03',
    title: 'NGOs and orphanages claim what they need',
    body: 'Verified organizations see food that matches their outstanding meal requirements and claim it — partially or in full — up to a bounded daily allowance.',
    icon: HandHeart,
  },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Verified organizations only',
    body: 'Every NGO, orphanage and kitchen is reviewed by an administrator before it can send or receive a single meal.',
  },
  {
    icon: Clock,
    title: 'FEFO inventory by default',
    body: 'Batches are tracked by expiry, and the system recommends what to use first — before it recommends what to discard.',
  },
  {
    icon: Scale,
    title: 'Need-driven allocation',
    body: 'Claims are checked against real remaining requirements per meal, with a small configurable buffer — never against guesswork.',
  },
  {
    icon: Sprout,
    title: 'Waste, measured honestly',
    body: 'Produced, consumed, redistributed and wasted are tracked separately, so the impact numbers are never inflated.',
  },
]

const STATS = [
  { value: '3', label: 'meal windows tracked per kitchen, per day' },
  { value: '+15', label: 'unit buffer above requirement, before claims lock' },
]

export default function LandingPage() {
  return (
    <div className="bg-paper text-ink">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-[1.2fr_0.8fr] gap-14 items-end">
        <div>
          <p className="text-sm font-medium text-brand-600 tracking-wide mb-5">
            For kitchens, social welfare organizations, food banks, individuals and biogas plants
          </p>
          <h1 className="font-display text-balance text-5xl md:text-6xl leading-[1.05] text-ink">
            Reduce food waste.
            <br />
            Redistribute surplus.
            <br />
            Feed communities.
          </h1>
          <p className="mt-7 text-lg text-ink-soft max-w-xl leading-relaxed">
            Irai turns a kitchen's daily surplus into a tracked, verified meal
            for the organization that needs it most — with every claim checked against
            real requirements.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="bg-brand-600 text-white px-6 py-3.5 rounded-sm hover:bg-brand-700 transition-colors font-medium inline-flex items-center gap-2"
            >
              Register with Irai <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="border border-line px-6 py-3.5 rounded-sm hover:bg-paper-sunken transition-colors font-medium text-ink"
            >
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-line">
        <div className="max-w-xl mb-14">
          <h2 className="font-display text-3xl text-ink">How it works</h2>
          <p className="text-ink-soft mt-3 leading-relaxed">
            Three roles, one accountable chain from kitchen to plate.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-3xl text-brand-300">{s.n}</span>
                <span className="h-9 w-9 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center">
                  <s.icon size={17} />
                </span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">{s.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="about" className="bg-brand-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-xl mb-14">
            <h2 className="font-display text-3xl">Built for accountability, not optics</h2>
            <p className="text-brand-100 mt-3 leading-relaxed">

            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="h-10 w-10 shrink-0 rounded-sm bg-white/10 flex items-center justify-center">
                  <f.icon size={18} />
                </span>
                <div>
                  <h3 className="font-medium text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-brand-100/90 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">
        {STATS.map((s) => (
          <div key={s.label} className="border-t-2 border-gold-400 pt-5">
            <p className="font-display text-4xl text-ink">{s.value}</p>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">{s.label}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-ink max-w-2xl mx-auto text-balance">
            Every meal that goes uneaten is a meal someone else needed.
          </h2>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink-soft">
        Irai — food surplus management &amp; redistribution platform.
      </footer>
    </div>
  )
}
