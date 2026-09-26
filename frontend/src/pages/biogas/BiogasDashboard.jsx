import { useCallback, useEffect, useState } from 'react'
import { Recycle, MapPin, Truck, ShieldCheck, Flame, RefreshCw, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import api from '../../services/api'
import { claimService } from '../../services/claimService'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../lib/format'
import { mediaUrl } from '../../lib/media'

export default function BiogasDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [foodRes, claimRes] = await Promise.all([
        api.get('/marketplace/food'),
        claimService.list(),
      ])
      setItems(Array.isArray(foodRes.data) ? foodRes.data : [])
      setClaims(Array.isArray(claimRes) ? claimRes : [])
    } catch (err) {
      setError(err?.message || 'Could not load biogas organic waste listings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const claimWaste = async (item) => {
    const available = Number(item.remaining_quantity ?? item.quantity)
    const quantity = window.prompt(
      `How many ${item.unit || 'kg'} of organic waste would you like to collect?`,
      String(available)
    )
    if (quantity === null || quantity.trim() === '') return
    const parsed = Number(quantity)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > available) {
      setError(`Enter a valid quantity up to ${available}.`)
      return
    }

    setClaimingId(item.id)
    setError('')
    setNotice('')
    try {
      const result = await claimService.claim(item.id, parsed)
      setNotice(
        `Organic waste claimed successfully! Your pickup PIN is ${result.pin}. The food provider can verify this PIN at collection.`
      )
      await load()
    } catch (err) {
      setError(err?.message || 'Could not claim this waste batch.')
      await load()
    } finally {
      setClaimingId(null)
    }
  }

  const activeClaims = claims.filter((c) => c.status !== 'COMPLETED')
  const completedClaims = claims.filter((c) => c.status === 'COMPLETED')
  const totalDivertedKg = claims.reduce((acc, c) => acc + Number(c.quantity || 0), 0)

  return (
    <DashboardLayout role="BIOGAS_PLANT" title="Biogas Plant Dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Biogas & Organic Waste Operations"
          description="   "
          action={
            <Button variant="secondary" onClick={load} loading={loading}>
              <RefreshCw size={15} /> Refresh
            </Button>
          }
        />

        {error && <ErrorState message={error} onRetry={load} />}
        {notice && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900 flex items-start gap-2">
            <ShieldCheck size={18} className="shrink-0 text-green-700 mt-0.5" />
            <div>{notice}</div>
          </div>
        )}

        {/* Live Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-soft">Processing Capacity</span>
                <Recycle size={18} className="text-brand-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-ink">
                {user?.capacity ? `${user.capacity} kg/day` : '5000 kg/day'}
              </div>

            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-soft">Available Waste Batches</span>
                <Flame size={18} className="text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-ink">{items.length}</div>

            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-soft">Active Pickups</span>
                <Truck size={18} className="text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-ink">{activeClaims.length}</div>

            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-soft">Total Waste Diverted</span>
                <ShieldCheck size={18} className="text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-ink">
                {totalDivertedKg.toFixed(1)} {items[0]?.unit || 'kg'}
              </div>

            </div>
          </Card>
        </div>

        {/* Available Organic Waste for Pickup */}
        <Card>
          <CardHeader
            title="Available Organic Waste for Collection"
            subtitle="   "
          />
          <CardBody>
            {loading && items.length === 0 ? (
              <LoadingState label="Scanning nearby food waste listings…" />
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Recycle size={32} className="mx-auto text-ink-soft mb-2" />
                <h3 className="font-semibold text-ink">No organic waste listings right now</h3>
                <p className="text-sm text-ink-soft mt-1">
                  When kitchens, banquet halls, or individuals post food marked ROTTEN or EXPIRED, it will appear here immediately for collection.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <article key={item.id} className="border border-line rounded-lg overflow-hidden bg-white flex flex-col justify-between">
                    <div>
                      {item.photo_url ? (
                        <img
                          src={mediaUrl(item.photo_url)}
                          alt={item.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-paper-sunken flex items-center justify-center text-ink-soft">
                          <Recycle size={28} />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-ink text-base">{item.title}</h4>
                          <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            {item.condition || 'ROTTEN'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-ink-soft line-clamp-2">{item.description}</p>
                        )}
                        <div className="text-xs space-y-1 text-ink-soft pt-1">
                          <p className="font-medium text-ink">
                            Available: {item.remaining_quantity ?? item.quantity} {item.unit}
                          </p>
                          <p className="flex items-center gap-1">
                            <Truck size={13} /> Source: {item.kitchen_name || 'Kitchen / Hall'}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin size={13} /> {item.distance_km != null ? `${item.distance_km} km away` : 'Distance unavailable'}
                          </p>
                          <p className="text-[11px]">Posted: {formatDateTime(item.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Button
                        className="w-full"
                        disabled={claimingId !== null}
                        loading={claimingId === item.id}
                        onClick={() => claimWaste(item)}
                      >
                        Claim for Biogas
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Claimed Waste & Collection History */}
        <Card>
          <CardHeader
            title="My Claimed Waste Batches"
            subtitle="  "
          />
          <CardBody>
            {claims.length === 0 ? (
              <p className="text-sm text-ink-soft py-4 text-center">You have not claimed any waste batches yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm divide-y divide-line">
                  <thead className="bg-paper text-ink-soft text-xs font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Waste Item</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Collection PIN</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Claimed At</th>
                      <th className="py-2.5 px-3">Route</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-paper-sunken/40">
                        <td className="py-3 px-3 font-medium text-ink">
                          {claim.food_title || `Listing #${claim.food_listing_id}`}
                        </td>
                        <td className="py-3 px-3">{claim.quantity}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm font-bold bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">
                            {claim.pin}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={claim.status === 'COMPLETED' ? 'success' : 'warning'}>
                            {claim.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-ink-soft">
                          {formatDateTime(claim.created_at)}
                        </td>
                        <td className="py-3 px-3">
                          {claim.kitchen_latitude != null && claim.kitchen_longitude != null ? (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${claim.kitchen_latitude},${claim.kitchen_longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded border border-brand-200"
                            >
                              <MapPin size={12} /> Google Maps
                            </a>
                          ) : (
                            <span className="text-xs text-ink-soft">Location unavailable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
