import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Plus, CheckCircle2, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { orphanageService } from '../../services/orphanageService'
import { claimService } from '../../services/claimService'
import { formatDateTime } from '../../lib/format'

export default function OrphanageRequirements() {
  const [requirements, setRequirements] = useState(null)
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    food_type: 'Lunch (Rice & Curry)',
    quantity: '50',
    unit: 'servings',
    notes: '',
  })

  const load = useCallback(async () => {
    try {
      setError('')
      const [reqData, claimsData] = await Promise.all([
        orphanageService.getRequirements(),
        claimService.list().catch(() => []),
      ])
      setRequirements(Array.isArray(reqData) ? reqData : [])
      setClaims(Array.isArray(claimsData) ? claimsData : [])
    } catch (e) {
      setError(e.message || 'Could not load requirements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    const qty = Number(form.quantity)
    if (!form.food_type.trim() || !qty || qty <= 0) {
      setError('Please provide a valid meal requirement and quantity')
      return
    }
    setSaving(true)
    setError('')
    try {
      await orphanageService.createRequirement({
        food_type: form.food_type.trim(),
        quantity: qty,
        unit: form.unit.trim() || 'servings',
        notes: form.notes.trim() || null,
      })
      setModalOpen(false)
      setForm({ food_type: '', quantity: '', unit: 'servings', notes: '' })
      await load()
    } catch (e) {
      setError(e.message || 'Could not add requirement')
    } finally {
      setSaving(false)
    }
  }

  // Calculate fulfillment stats
  const totalRequired = requirements ? requirements.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0) : 0
  const totalClaimedPortions = claims.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0)

  return (
    <DashboardLayout role="ORPHANAGE" title="Requirements">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Button onClick={() => setModalOpen(true)} className="self-start sm:self-auto flex items-center gap-2">
          <Plus size={16} /> Add requirement
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="text-xs text-ink-soft uppercase tracking-wider font-medium">Total servings Needed</div>
            <div className="text-2xl font-display mt-1 text-ink">{totalRequired}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-ink-soft uppercase tracking-wider font-medium"> servings Claimed</div>
            <div className="text-2xl font-display mt-1 text-emerald-600">{totalClaimedPortions}</div>

          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-ink-soft uppercase tracking-wider font-medium">Fulfillment Rate</div>
            <div className="text-2xl font-display mt-1 text-brand-700">
              {totalRequired > 0 ? `${Math.min(100, Math.round((totalClaimedPortions / totalRequired) * 100))}%` : '100%'}
            </div>
            <div className="text-xs text-ink-soft mt-1">
              {totalClaimedPortions >= totalRequired ? 'Target fully met!' : `${Math.max(0, totalRequired - totalClaimedPortions)} servings pending`}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal / Inline Form for Adding Requirement */}
      {modalOpen && (
        <Card className="mb-6 border-brand-200 bg-brand-50/20">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold">Post New Meal Requirement</h3>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Meal type / Name"
                    required
                    placeholder="e.g. Lunch (Rice, Sambar, Veg)"
                    value={form.food_type}
                    onChange={(e) => setForm({ ...form, food_type: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="50"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Unit"
                  placeholder="servings, kg, boxes"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
                <Input
                  label="Dietary notes / Specifics (optional)"
                  placeholder="e.g. Non-spicy, strictly vegetarian"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save requirement</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </DashboardLayout>
  )
}
