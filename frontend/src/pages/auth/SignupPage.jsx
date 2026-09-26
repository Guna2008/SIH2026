import { Link } from 'react-router-dom'
import { HandHeart, Soup, Warehouse, UserRound, Recycle, ArrowRight } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'

const OPTIONS = [
  { to: '/signup/social-welfare', icon: HandHeart, title: 'Social Welfare Organization', body: 'Register an NGO or orphanage.' },
  { to: '/signup/kitchen', icon: Soup, title: 'Institutional Kitchen', body: 'Publish and manage kitchen surplus.' },
  { to: '/signup/food-bank', icon: Warehouse, title: 'Food Bank', body: 'Receive first priority for suitable surplus within your collection radius.' },
  { to: '/signup/individual', icon: UserRound, title: 'Individual / Function Hall', body: 'Register as an individual or function hall and share surplus food.' },
  { to: '/signup/biogas', icon: Recycle, title: 'Biogas Plant', body: 'Register to collect food marked as rotten or unsuitable for people.' },
]
export default function SignupPage() {
  return <AuthLayout eyebrow="Create an account" title="Join Irai" subtitle="Choose the account type that matches you" wide footer={<>Already registered? <Link to="/login" className="text-brand-600 font-medium hover:underline">Log in</Link></>}>
    <div className="grid gap-3">{OPTIONS.map(opt => <Link key={opt.to} to={opt.to} className="group flex items-center gap-4 border border-line rounded-md px-5 py-4 hover:border-brand-400 hover:bg-brand-50/40 transition-colors"><span className="h-11 w-11 shrink-0 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center"><opt.icon size={19} /></span><div className="flex-1"><p className="font-medium text-ink">{opt.title}</p><p className="text-sm text-ink-soft mt-0.5">{opt.body}</p></div><ArrowRight size={16} className="text-ink-soft group-hover:text-brand-600" /></Link>)}</div>
  </AuthLayout>
}
