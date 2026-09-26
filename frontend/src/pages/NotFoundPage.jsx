import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 text-center">
      <span className="h-10 w-10 rounded-sm bg-brand-600 text-white flex items-center justify-center mb-6">
        <Leaf size={18} />
      </span>
      <p className="font-display text-5xl text-ink mb-3">404</p>
      <p className="text-ink-soft mb-8">This page doesn't exist, or you don't have access to it.</p>
      <Link to="/" className="bg-brand-600 text-white px-5 py-2.5 rounded-sm hover:bg-brand-700 font-medium">
        Back to home
      </Link>
    </div>
  )
}
