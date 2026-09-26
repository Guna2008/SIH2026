import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { kitchenService } from '../../services/kitchenService'

export default function KitchenProfile() {
    const [user, setUser] = useState(null); const [form, setForm] = useState({ name: '', phone: '', address: '', latitude: '', longitude: '' }); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
    const load = async () => { try { const u = await kitchenService.getProfile(); setUser(u); setForm({ name: u.name || '', phone: u.phone || '', address: u.address || '', latitude: u.latitude ?? '', longitude: u.longitude ?? '' }) } catch (e) { setError(e.message) } }; useEffect(() => { load() }, [])
    const save = async e => { e.preventDefault(); setSaving(true); try { const u = await kitchenService.updateProfile({ ...form, latitude: form.latitude === '' ? null : Number(form.latitude), longitude: form.longitude === '' ? null : Number(form.longitude) }); setUser(u) } catch (e) { setError(e.message) } finally { setSaving(false) } }
    if (!user && !error) return <DashboardLayout role="KITCHEN" title="Profile"><LoadingState /></DashboardLayout>
    return <DashboardLayout role="KITCHEN" title="Profile"><PageHeader title="Kitchen profile" description="    " />{error && <ErrorState message={error} onRetry={load} />}<Card className="max-w-xl"><CardBody><form onSubmit={save} className="space-y-4"><Input label="Email" value={user?.email || ''} disabled /><Input label="Kitchen name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input label="Latitude" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /><Input label="Longitude" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div><Button type="submit" loading={saving}>Save changes</Button></form></CardBody></Card></DashboardLayout>
}
