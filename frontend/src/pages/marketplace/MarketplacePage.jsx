import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import api from '../../services/api'
import { claimService } from '../../services/claimService'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import LocationPicker from '../../components/shared/LocationPicker'

const PROVIDERS = ['INDIVIDUAL', 'NGO', 'ORPHANAGE', 'KITCHEN']
export default function MarketplacePage() {
  const { role } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [routeClaim, setRouteClaim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', food_type: 'VEG', quantity: '', unit: 'portions', condition: 'GOOD' })
  const [photo, setPhoto] = useState(null)
  const load = async () => { setLoading(true); setError(''); try { const { data } = await api.get('/marketplace/food'); setItems(data) } catch (e) { setError(e.message || 'Could not load listings') } finally { setLoading(false) } }
  useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer) }, [])
  const publish = async (e) => { e.preventDefault(); setError(''); setMessage(''); try { const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.append(k, v)); if (photo) fd.append('photo', photo); await api.post('/marketplace/surplus', fd); setMessage('Surplus listing published. Food banks can see good-condition food immediately; other recipients see it after 30 minutes.'); setForm({ title: '', description: '', food_type: 'VEG', quantity: '', unit: 'portions', condition: 'GOOD' }); setPhoto(null); await load() } catch (e) { setError(e.message || 'Unable to publish surplus') } }
  const claim = async (item) => { const q = window.prompt(`How many ${item.unit} would you like to claim?`, String(item.remaining_quantity)); if (!q) return; try { const result = await claimService.claim(item.id, Number(q)); setRouteClaim(result); setMessage(`Food claimed. Your collection PIN is ${result.pin}. Use the route button below to navigate to the provider.`); await load() } catch (e) { setError(e.message || 'Unable to claim food') } }
  const isBiogas = role === 'BIOGAS_PLANT'
  const canPublish = PROVIDERS.includes(role)
  return <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">
    <header><h1 className="text-3xl font-display text-ink mt-1">Surplus Food</h1></header>
    {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>}{message && <div className="p-3 rounded border border-green-200 bg-green-50 text-green-800">{message}{routeClaim?.kitchen_latitude != null && routeClaim?.kitchen_longitude != null && <div className="mt-3"><a className="inline-flex items-center gap-2 rounded bg-green-700 px-3 py-2 text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${routeClaim.kitchen_latitude},${routeClaim.kitchen_longitude}`} target="_blank" rel="noreferrer"><MapPin size={16} /> Open route in Google Maps</a></div>}</div>}
    {canPublish && <section className="bg-white border border-line rounded-lg p-5"><h2 className="text-xl font-semibold mb-4">Publish surplus food</h2><form onSubmit={publish} className="grid md:grid-cols-2 gap-4">
      <label className="text-sm">Food / dish name<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2" /></label>
      <label className="text-sm">Quantity<input required type="number" min="0.1" step="any" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2" /></label>
      <label className="text-sm">Food category<select value={form.food_type} onChange={e => setForm({ ...form, food_type: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2"><option value="VEG">Vegetarian</option><option value="NON_VEG">Non-vegetarian</option><option value="ANY">Any</option></select></label>
      <label className="text-sm">Condition<select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2"><option value="GOOD">Good — suitable for people</option><option value="ROTTEN">Rotten / unsuitable — biogas only</option></select></label>
      <label className="text-sm">Unit<input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2" /></label>
      <label className="text-sm">Food photo (optional)<input type="file" accept="image/*" required onChange={e => setPhoto(e.target.files?.[0] || null)} className="mt-1 block w-full" /></label>
      <label className="text-sm md:col-span-2">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full border border-line rounded px-3 py-2" rows="2" /></label>
      <div className="md:col-span-2"><Button type="submit">Publish listing</Button></div>
    </form></section>}
  </main>
}
