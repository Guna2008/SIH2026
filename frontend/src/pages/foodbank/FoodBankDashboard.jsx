import { useCallback, useEffect, useState } from 'react'
import { MapPin, PackageCheck, RefreshCw, ShieldCheck, Clock3, Truck } from 'lucide-react'
import api from '../../services/api'
import { claimService } from '../../services/claimService'
import Button from '../../components/ui/Button'
import DashboardLayout from '../../components/layout/DashboardLayout'

function formatDate(value) {
  if (!value) return 'Recently posted'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently posted' : date.toLocaleString()
}

export default function FoodBankDashboard() {
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [foodResponse, claimResponse] = await Promise.all([api.get('/marketplace/food'), claimService.list()])
      setItems(Array.isArray(foodResponse.data) ? foodResponse.data : [])
      setClaims(Array.isArray(claimResponse) ? claimResponse : [])
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not load nearby meals. Please sign in again if your session expired.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer) }, [load])

  const claimMeal = async (item) => {
    const available = Number(item.remaining_quantity ?? item.quantity)
    const quantity = window.prompt(`How many ${item.unit || 'servings'} would you like to claim?`, String(available))
    if (quantity === null || quantity.trim() === '') return
    const parsed = Number(quantity)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > available) {
      setError(`Enter a quantity greater than 0 and no more than ${available}.`); return
    }
    setClaimingId(item.id); setError(''); setNotice('')
    try {
      const claim = await claimService.claim(item.id, parsed)
      setNotice(`Meal claimed successfully. Your collection PIN is ${claim.pin}. The college can see the same PIN in its claims/collection records. Keep this PIN for pickup verification.`)
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not claim this meal. It may have been claimed by another food bank.')
      await load()
    } finally { setClaimingId(null) }
  }

  const activeClaims = claims.filter((claim) => !['COMPLETED', 'CANCELLED'].includes(String(claim.status || '').toUpperCase()))
  const completedClaims = claims.filter((claim) => String(claim.status || '').toUpperCase() === 'COMPLETED')

  return <DashboardLayout role="FOOD_BANK" title="Food Bank dashboard"><div className="space-y-7">
    <header className="space-y-2"><p className="text-sm font-semibold tracking-wide text-brand-600">FOOD BANK</p><h1 className="font-display text-3xl text-ink">Nearby meals for collection</h1></header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-ink-soft">Nearby meals available</p><p className="mt-1 text-2xl font-semibold">{items.length}</p></div>
      <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-ink-soft">Awaiting pickup</p><p className="mt-1 text-2xl font-semibold">{activeClaims.length}</p></div>
      <div className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-ink-soft">Collection completed</p><p className="mt-1 text-2xl font-semibold">{completedClaims.length}</p></div>
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-ink">Available within your range</h2></div><Button variant="secondary" onClick={load} loading={loading}><RefreshCw size={16} className="mr-2" />Refresh</Button></div>
      {loading ? <div className="rounded-xl border border-line bg-white p-8 text-center text-ink-soft">Loading eligible nearby meals…</div> : items.length === 0 ? <div className="rounded-xl border border-line bg-white p-8 text-center"><PackageCheck className="mx-auto mb-3 text-ink-soft" size={30} /><h3 className="font-semibold">No eligible meals right now</h3><p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">New college/institution listings will appear here when they are within your saved collection radius, match your food preferences, and are still in the food-bank priority window. Check your profile location and radius if you expected to see a listing.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-line bg-white">
        {item.photo_url && <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${item.photo_url}`} alt={item.title} className="h-44 w-full object-cover" loading="lazy" />}
        <div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-ink">{item.title}</h3><span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">Good condition</span></div>
          {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}<p className="text-sm font-medium">{item.remaining_quantity ?? item.quantity} {item.unit || 'servings'} available</p>
          <div className="space-y-1.5 text-sm text-ink-soft"><p className="flex items-center gap-2"><Truck size={15} /> Institution: {item.kitchen_name || 'College / institution'}</p><p className="flex items-center gap-2"><MapPin size={15} />{item.distance_km == null ? 'Distance unavailable' : `${item.distance_km} km away`}</p><p className="flex items-center gap-2"><Clock3 size={15} /> Posted: {formatDate(item.created_at)}</p>{item.expiry_date && <p>Expiry: {formatDate(item.expiry_date)}</p>}</div>
          <div></div><Button className="w-full" disabled={claimingId !== null} loading={claimingId === item.id} onClick={() => claimMeal(item)}>Claim meal</Button>
        </div></article>)}</div>}
    </section>
    <section className="space-y-4"><div><h2 className="text-xl font-semibold text-ink">My claimed meals</h2><p className="mt-1 text-sm text-ink-soft">Use the PIN for collection. The institution can verify it against its own listing.</p></div>
      {claims.length === 0 ? <div className="rounded-xl border border-line bg-white p-6 text-sm text-ink-soft">You have not claimed any meals yet.</div> : <div className="overflow-x-auto rounded-xl border border-line bg-white"><table className="min-w-full divide-y divide-line text-left text-sm"><thead className="bg-paper text-ink-soft"><tr><th className="px-4 py-3 font-medium">Meal</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium">Pickup PIN</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Claimed</th><th className="px-4 py-3 font-medium">Route</th></tr></thead><tbody className="divide-y divide-line">{claims.map((claim) => <tr key={claim.id}><td className="px-4 py-3 font-medium">{claim.food_title || `Listing #${claim.food_listing_id}`}</td><td className="px-4 py-3">{claim.quantity}</td><td className="px-4 py-3"><span className="rounded bg-brand-50 px-2 py-1 font-mono font-semibold text-brand-800">{claim.pin || '—'}</span></td><td className="px-4 py-3">{claim.status}</td><td className="px-4 py-3">{formatDate(claim.created_at)}</td><td className="px-4 py-3">{claim.kitchen_latitude != null && claim.kitchen_longitude != null ? <a className="inline-flex items-center gap-1 rounded bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700" href={`https://www.google.com/maps/dir/?api=1&destination=${claim.kitchen_latitude},${claim.kitchen_longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Get route</a> : <span className="text-xs text-ink-soft">Provider location unavailable</span>}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="rounded-xl border border-line bg-white p-5"><h2 className="text-lg font-semibold">Redistribution through your network</h2><p className="mt-2 text-sm text-ink-soft">After the college verifies collection using the pickup PIN, the food bank can redistribute the collected food through its own community network. The college-to-food-bank pickup PIN confirms collection of the original listing; redistribution should be recorded separately so collected food cannot reappear as unclaimed marketplace inventory.</p></section>
  </div></DashboardLayout>
}
