import { useEffect, useState } from 'react'
import { Soup, Sparkles } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import { kitchenService } from '../../services/kitchenService'
import { formatDateTime } from '../../lib/format'

const initial = { dish: '', special_day: false, special_day_name: '', total_students: '', students_on_leave: '', students_staying: '', prepared_quantity: '', surplus_quantity: '' }

export default function KitchenProduction() {
  const [meals, setMeals] = useState(null)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState(null)

  const load = async () => {
    try { setError(''); setMeals(await kitchenService.getMeals()) } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const predict = async () => {
    setPredicting(true); setError('')
    try {
      const result = await kitchenService.predictSurplus({
        day_of_week: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()),
        dish: form.dish,
        special_day: form.special_day,
        special_day_name: form.special_day ? form.special_day_name : null,
        total_students: Number(form.total_students || 0),
        students_on_leave: Number(form.students_on_leave || 0),
        students_staying: form.students_staying === '' ? Math.max(0, Number(form.total_students || 0) - Number(form.students_on_leave || 0)) : Number(form.students_staying),
        prepared_quantity: form.prepared_quantity === '' ? null : Number(form.prepared_quantity),
      })
      setPrediction(result)
    } catch (e) { setError(e.message) } finally { setPredicting(false) }
  }

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await kitchenService.createMeal({
        dish: form.dish,
        special_day: form.special_day,
        special_day_name: form.special_day ? form.special_day_name : null,
        total_students: Number(form.total_students),
        students_on_leave: Number(form.students_on_leave),
        students_staying: form.students_staying === '' ? null : Number(form.students_staying),
        prepared_quantity: form.prepared_quantity === '' ? null : Number(form.prepared_quantity),
        surplus_quantity: form.surplus_quantity === '' ? null : Number(form.surplus_quantity),
      })
      setForm(initial); await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <DashboardLayout role="KITCHEN" title="Daily meal data">
      <PageHeader title="Kitchen meal & prediction data" description="   " />
      {error && <ErrorState message={error} onRetry={load} />}
      <div className="grid lg:grid-cols-[420px_1fr] gap-6">
        <Card>
          <CardHeader title="Record today's meal" subtitle="  " />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <Input label="Dish" required value={form.dish} onChange={e => setForm({ ...form, dish: e.target.value })} placeholder="Dish name" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.special_day} onChange={e => setForm({ ...form, special_day: e.target.checked })} /> Special day</label>
              {form.special_day && <Input label="Special day" required value={form.special_day_name} onChange={e => setForm({ ...form, special_day_name: e.target.value })} placeholder="Name of the special day" />}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total students" type="number" min="0" required value={form.total_students} onChange={e => setForm({ ...form, total_students: e.target.value })} />
                <Input label="Students on leave" type="number" min="0" required value={form.students_on_leave} onChange={e => setForm({ ...form, students_on_leave: e.target.value })} />
              </div>
              <Input label="Students staying" type="number" min="0" value={form.students_staying} onChange={e => setForm({ ...form, students_staying: e.target.value })} hint="   " />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prepared quantity" type="number" min="0" step="0.01" value={form.prepared_quantity} onChange={e => setForm({ ...form, prepared_quantity: e.target.value })} />
                <Input label="Surplus quantity" type="number" min="0" step="0.01" value={form.surplus_quantity} onChange={e => setForm({ ...form, surplus_quantity: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2"><Button type="button" variant="gold" loading={predicting} onClick={predict}><Sparkles size={16} /> Predict surplus</Button><Button type="submit" loading={saving}><Soup size={16} /> Save meal data</Button></div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Saved meal records" subtitle="    " />
          <CardBody>
            {meals === null ? <LoadingState /> : meals.length === 0 ? <p className="text-sm text-ink-soft">No meal records yet.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b border-line"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Dish</th><th className="py-3 pr-4">Meal</th><th className="py-3 pr-4">Students</th><th className="py-3">Special day</th></tr></thead><tbody>
                {meals.map(m => <tr key={m.id} className="border-b border-line"><td className="py-3 pr-4">{formatDateTime(m.meal_date)}<div className="text-xs text-ink-soft">{m.day_of_week}</div></td><td className="py-3 pr-4 font-medium">{m.dish}</td><td className="py-3 pr-4">{m.meal_type}</td><td className="py-3 pr-4">{m.students_staying} / {m.total_students}</td><td className="py-3">{m.special_day ? m.special_day_name : 'No'}</td></tr>)}
              </tbody></table></div>
            )}
          </CardBody>
        </Card>
      </div>
      <Modal open={!!prediction} onClose={() => setPrediction(null)} title="Surplus prediction">
        {prediction && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-md border border-line p-4"><p className="text-xs text-ink-soft">Predicted required</p><p className="text-2xl font-display mt-1">{prediction.predicted_required_quantity}</p></div><div className="rounded-md border border-line p-4"><p className="text-xs text-ink-soft">Predicted surplus</p><p className="text-2xl font-display mt-1">{prediction.predicted_surplus_quantity}</p></div></div>
          <div className="rounded-md bg-paper-sunken p-4"><p className="font-medium">Recommendation</p><p className="text-sm text-ink-soft mt-1">{prediction.recommendation}</p></div>
          <p className="text-xs text-ink-soft">Prediction source: {prediction.source}. Your friend can replace the backend baseline by setting SURPLUS_MODEL_URL.</p>
        </div>}
      </Modal>
    </DashboardLayout>
  )
}
