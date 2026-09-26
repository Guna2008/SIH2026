import { useEffect, useState } from 'react'
import { HandHeart, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { ngoService } from '../../services/ngoService'
import { formatDateTime } from '../../lib/format'
import { mapsUrl } from '../../lib/format'
import LocationMap from '../../components/shared/LocationMap'

export default function NgoClaims() {
    const [claims, setClaims] = useState(null); const [error, setError] = useState(''); const load = async () => { try { setError(''); setClaims(await ngoService.getClaims()) } catch (e) { setError(e.message) } }; useEffect(() => { load() }, [])
    return <DashboardLayout role="NGO" title="My claims">{error && <ErrorState message={error} onRetry={load} />} {claims === null ? <LoadingState /> : claims.length === 0 ? <Card><CardBody><div className="text-center py-10"><HandHeart className="mx-auto mb-3 text-ink-soft" /><p>No claims yet.</p></div></CardBody></Card> : <div className="space-y-4">{claims.map(c => <Card key={c.id} accent="#16834A"><CardBody><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5"><div><h3 className="font-display text-lg">{c.food_title}</h3><p className="text-sm text-ink-soft mt-1">{c.quantity} serving | {c.meal_type} | {c.status}</p><p className="text-xs text-ink-soft mt-2">Claimed {formatDateTime(c.created_at)}</p></div><div className="text-left md:text-right"><div className="text-xs text-ink-soft">Collection PIN</div><div className="text-3xl font-display tracking-[0.25em]">{c.pin}</div></div></div><div className="mt-5 pt-4 border-t border-line space-y-4"><div className="flex flex-wrap items-center gap-4"><span className="text-sm flex items-center gap-1"><MapPin size={15} />{c.kitchen_name}</span>{mapsUrl(c.kitchen_latitude, c.kitchen_longitude) && <a className="text-sm text-brand-700 underline" href={mapsUrl(c.kitchen_latitude, c.kitchen_longitude)} target="_blank" rel="noreferrer">Get directions</a>}</div><LocationMap latitude={c.kitchen_latitude} longitude={c.kitchen_longitude} title={`${c.kitchen_name || 'Kitchen'} location`} /></div></CardBody></Card>)}</div>}</DashboardLayout>
}
