import { useCallback, useEffect, useState } from 'react'
import { HandHeart, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import Card, { CardBody } from '../../components/ui/Card'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import { claimService } from '../../services/claimService'
import { formatDateTime } from '../../lib/format'

export default function OrphanageClaims() {
  const [claims, setClaims] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { try { setError(''); const data = await claimService.list(); setClaims(Array.isArray(data) ? data : []) } catch (e) { setError(e.message || 'Could not load claim history') } }, [])
  useEffect(() => { load() }, [load])
  return <DashboardLayout role="ORPHANAGE" title="My claims"><PageHeader title="Claim history" description="" />{error && <ErrorState message={error} onRetry={load} />}{claims === null ? <LoadingState /> : claims.length === 0 ? <EmptyState icon={HandHeart} title="No claims yet" message="Food you claim will appear here." /> : <div className="grid gap-3">{claims.map(c => <Card key={c.id}><CardBody><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg">{c.food_title || `Food claim #${c.id}`}</h3><p className="text-sm text-ink-soft">{c.quantity} servings | {c.kitchen_name || 'Food provider'}</p><p className="text-xs text-ink-soft mt-1">Claimed {formatDateTime(c.created_at)}</p></div><Badge>{c.status}</Badge></div>{c.status !== 'COMPLETED' && c.pin && <p className="mt-3 text-sm">PIN: <strong className="tracking-widest">{c.pin}</strong></p>}{c.kitchen_latitude != null && c.kitchen_longitude != null && <a className="mt-3 inline-flex items-center gap-2 rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${c.kitchen_latitude},${c.kitchen_longitude}`} target="_blank" rel="noreferrer"><MapPin size={15} /> Get route to provider</a>}</CardBody></Card>)}</div>}</DashboardLayout>
}
