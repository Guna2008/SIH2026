import { useEffect, useState } from 'react'
import { HandHeart, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { kitchenService } from '../../services/kitchenService'
import { formatDateTime } from '../../lib/format'

export default function KitchenDonations() {
    const [rows, setRows] = useState(null); const [pins, setPins] = useState({}); const [error, setError] = useState(''); const [busy, setBusy] = useState(null)
    const load = async () => { try { setError(''); setRows(await kitchenService.getDonations()) } catch (e) { setError(e.message) } }; useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer) }, [])
    const verify = async id => { setBusy(id); try { await kitchenService.verifyClaim(id, pins[id] || ''); await load() } catch (e) { setError(e.message) } finally { setBusy(null) } }
    return <DashboardLayout role="KITCHEN" title="Donations"><PageHeader title="Claims & collection PINs" description="   " />{error && <ErrorState message={error} onRetry={load} />} {rows === null ? <LoadingState /> : rows.length === 0 ? <Card><CardBody><div className="text-center py-10"><HandHeart className="mx-auto mb-3 text-ink-soft" /><p>No claims yet.</p></div></CardBody></Card> : <div className="space-y-4">{rows.map(r => <Card key={r.id}><CardBody><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"><div><h3 className="font-display text-lg">{r.food_title}</h3><p className="text-sm text-ink-soft mt-1">{r.claimant_role || 'Recipient'}: {r.claimant_name} · {r.quantity} servings</p><p className="text-xs text-ink-soft mt-2">Claimed {formatDateTime(r.created_at)}</p>{r.claimant_latitude != null && r.claimant_longitude != null && <a className="mt-2 inline-flex items-center gap-1 text-sm text-brand-700 underline" href={`https://www.google.com/maps/dir/?api=1&destination=${r.claimant_latitude},${r.claimant_longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Recipient route</a>}</div><div className="w-full lg:w-72"><div className="text-xs text-ink-soft mb-1">Security PIN</div><div className="text-2xl font-display tracking-[0.25em] mb-2">{r.pin}</div>{r.status === 'COMPLETED' ? <span className="text-sm text-brand-700">Collection verified</span> : <div className="flex gap-2"><Input aria-label="PIN" maxLength={4} inputMode="numeric" value={pins[r.id] || ''} onChange={e => setPins({ ...pins, [r.id]: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="Enter NGO PIN" /><Button loading={busy === r.id} onClick={() => verify(r.id)}>Verify</Button></div>}</div></div></CardBody></Card>)}</div>}</DashboardLayout>
}
