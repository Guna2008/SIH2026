import { useEffect, useState } from 'react'
import { Package, Camera } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { kitchenService } from '../../services/kitchenService'
import { formatDateTime } from '../../lib/format'
import { mediaUrl } from '../../lib/media'

const initial = { title:'', description:'', food_type:'', quantity:'', unit:'servings', pickup_time:'', condition:'GOOD' }

export default function KitchenSurplus() {
  const [foods, setFoods] = useState(null)
  const [form, setForm] = useState(initial)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const load = async () => { try { setError(''); setFoods(await kitchenService.getSurplus()) } catch(e) { setError(e.message) } }
  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer) }, [])
  const submit = async e => {
    e.preventDefault(); if (!photo) { setError('Please upload a food photo.'); return }
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => fd.append(k,v))
      fd.append('photo', photo)
      await kitchenService.createSurplus(fd)
      setForm(initial); setPhoto(null); e.target.reset(); await load()
    } catch(e) { setError(e.message) } finally { setSaving(false) }
  }
  return <DashboardLayout role="KITCHEN" title="Surplus">
    <PageHeader title="Post surplus food" description="Upload a photo. The backend automatically decides Breakfast, Lunch, or Dinner from server time." />
    {error && <ErrorState message={error} onRetry={load} />}
    <div className="grid lg:grid-cols-[420px_1fr] gap-6">
      <Card><CardHeader title="New surplus" subtitle="No manual meal-type selection is allowed."/><CardBody>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Food / dish name" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Vegetable rice" />
          <Input label="Food type" value={form.food_type} onChange={e=>setForm({...form,food_type:e.target.value})} placeholder="Rice meal" />
          <Input label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Freshly prepared" />
          <label className="block text-sm font-medium">Food condition<select required value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2"><option value="GOOD">Good — suitable for people</option><option value="ROTTEN">Rotten / unsuitable — biogas only</option></select><span className="mt-1 block text-xs text-ink-soft">Rotten food is hidden from people and shown only to biogas plants.</span></label>
          <div className="grid grid-cols-2 gap-3"><Input label="Quantity" type="number" min="0.01" step="0.01" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/><Input label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></div>
          <Input label="Pickup time (optional)" value={form.pickup_time} onChange={e=>setForm({...form,pickup_time:e.target.value})} placeholder="2:30 PM" />
          <label className="block text-sm font-medium">Food photo<input className="mt-1.5 block w-full text-sm" type="file" accept="image/*" required onChange={e=>setPhoto(e.target.files?.[0]||null)}/><span className="text-xs text-ink-soft">Required for every surplus listing.</span></label>
          <Button type="submit" loading={saving}><Camera size={16}/> Publish surplus</Button>
        </form>
      </CardBody></Card>
      <Card><CardHeader title="Your surplus listings" subtitle="This list refreshes automatically every 30 seconds."/><CardBody>
        <div className="mb-3 flex justify-end"><Button type="button" variant="secondary" onClick={load}>Refresh listings</Button></div>
        {foods===null?<LoadingState/>:foods.length===0?<p className="text-sm text-ink-soft">No surplus listings yet.</p>:<div className="grid md:grid-cols-2 gap-4">{foods.map(f=><div key={f.id} className="border border-line rounded-md overflow-hidden">{f.photo_url&&<img src={mediaUrl(f.photo_url)} alt={f.title} className="w-full h-44 object-cover"/>}<div className="p-4"><div className="flex justify-between gap-3"><div><h3 className="font-medium">{f.title}</h3><p className="text-sm text-ink-soft">{f.meal_type} · {f.remaining_quantity} {f.unit} remaining · {f.condition || 'GOOD'}</p></div><span className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded">{f.status}</span></div><p className="text-xs text-ink-soft mt-2">Posted {formatDateTime(f.created_at)}</p></div></div>)}</div>}
      </CardBody></Card>
    </div>
  </DashboardLayout>
}
