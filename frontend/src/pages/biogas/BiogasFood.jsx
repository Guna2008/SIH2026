import { useCallback, useEffect, useState } from 'react'
import { Recycle, MapPin, Truck, RefreshCw } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import api from '../../services/api'
import { claimService } from '../../services/claimService'
import { formatDateTime } from '../../lib/format'
import { mediaUrl } from '../../lib/media'

export default function BiogasFood() {
  const [items, setItems] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const load = useCallback(async () => {
    try {
      setError('')
      const res = await api.get('/marketplace/food')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e.message || 'Could not load organic waste listings.')
    }
  }, [])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    return () => window.clearInterval(timer)
  }, [load])

  const claim = async (item) => {
    const available = Number(item.remaining_quantity ?? item.quantity)
    const quantity = window.prompt(
      `How many ${item.unit || 'kg'} of organic waste would you like to collect?`,
      String(available)
    )
    if (!quantity || !quantity.trim()) return
    const parsed = Number(quantity)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > available) {
      setError(`Enter a valid quantity between 0.1 and ${available}`)
      return
    }

    setClaimingId(item.id)
    setError('')
    try {
      const result = await claimService.claim(item.id, parsed)
      setSuccess(result)
      await load()
    } catch (e) {
      setError(e.message || 'Failed to claim waste.')
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <DashboardLayout role="BIOGAS_PLANT" title="Organic Waste Listings">
      <PageHeader
        title="Organic Waste for Biogas Generation"
        description="  "
        action={
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {success && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardBody>
            <h3 className="font-display text-lg text-amber-950 font-semibold">Organic Waste Claim Confirmed</h3>
            <p className="text-sm text-amber-900 mt-1">
              {success.food_title} · {success.quantity} units reserved
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs uppercase font-medium text-amber-800">Collection PIN:</span>
              <span className="text-2xl font-mono font-bold tracking-widest text-amber-900 bg-white px-3 py-1 rounded border border-amber-300">
                {success.pin}
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-2">
              Present this PIN to the facility manager upon arrival.
            </p>
          </CardBody>
        </Card>
      )}

      {items === null ? (
        <LoadingState label="Loading organic waste batches…" />
      ) : items.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <Recycle size={32} className="mx-auto text-ink-soft mb-3" />
              <h3 className="font-semibold text-ink">No organic waste listings right now</h3>
              <p className="text-sm text-ink-soft mt-1">
                When kitchens or event halls upload spoiled or expired batches, they appear here.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((f) => (
            <Card key={f.id} className="overflow-hidden flex flex-col justify-between">
              <div>
                {f.photo_url ? (
                  <img
                    src={mediaUrl(f.photo_url)}
                    alt={f.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-paper-sunken flex items-center justify-center text-ink-soft">
                    <Recycle size={32} />
                  </div>
                )}
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg text-ink font-semibold">{f.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      {f.condition || 'ROTTEN'}
                    </span>
                  </div>
                  {f.description && (
                    <p className="text-xs text-ink-soft mt-2 line-clamp-2">{f.description}</p>
                  )}
                  <div className="mt-3 space-y-1 text-sm">
                    <p>
                      <strong>Available:</strong> {f.remaining_quantity ?? f.quantity} {f.unit}
                    </p>
                    <p className="flex items-center gap-1 text-ink-soft">
                      <Truck size={14} /> {f.kitchen_name || 'Food Provider'}
                    </p>
                    <p className="flex items-center gap-1 text-ink-soft">
                      <MapPin size={14} />{' '}
                      {f.distance_km != null ? `${f.distance_km} km away` : 'Distance unavailable'}
                    </p>
                    <p className="text-xs text-ink-soft pt-1">
                      Posted: {formatDateTime(f.created_at)}
                    </p>
                  </div>
                </CardBody>
              </div>

              <div className="p-4 pt-0">
                <Button
                  className="w-full"
                  loading={claimingId === f.id}
                  disabled={claimingId !== null}
                  onClick={() => claim(f)}
                >
                  Claim for Biogas
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
