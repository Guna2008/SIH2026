import { useEffect, useState } from 'react'
import { Boxes, Camera, Clock3, Plus, Sparkles, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import { inventoryService } from '../../services/inventoryService'
import { formatDate, formatDateTime } from '../../lib/format'
import CameraScanModal from '../../components/shared/CameraScanModal'

const emptyItem = { name: '', category: '', quantity: '', unit: 'kg', minimum_stock: '' }
const emptyBatch = { quantity: '', unit: 'kg', expiry_date: '' }

function expiryLabel(status) {
  if (status === 'URGENT') return 'Use first'
  if (status === 'SOON') return 'Expiring soon'
  if (status === 'EXPIRED') return 'Expired'
  return status || 'No expiry'
}

export default function KitchenInventory() {
  const [items, setItems] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [error, setError] = useState('')
  const [itemForm, setItemForm] = useState(emptyItem)
  const [batchForm, setBatchForm] = useState(emptyBatch)
  const [itemOpen, setItemOpen] = useState(false)
  const [batchItem, setBatchItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false)
  const [scan, setScan] = useState(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  const load = async () => {
    try {
      setError('')
      const [inventory, expiry] = await Promise.all([inventoryService.list(), inventoryService.expiryRecommendations()])
      setItems(inventory)
      setRecommendations(expiry)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  const createItem = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await inventoryService.create({
        name: itemForm.name,
        category: itemForm.category || null,
        quantity: Number(itemForm.quantity || 0),
        unit: itemForm.unit,
        minimum_stock: Number(itemForm.minimum_stock || 0),
      })
      setItemForm(emptyItem); setItemOpen(false); await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const addBatch = async (e) => {
    e.preventDefault(); if (!batchItem) return
    setSaving(true); setError('')
    try {
      await inventoryService.addBatch(batchItem.id, {
        quantity: Number(batchForm.quantity),
        unit: batchForm.unit,
        expiry_date: batchForm.expiry_date ? new Date(`${batchForm.expiry_date}T23:59:59`).toISOString() : null,
      })
      setBatchForm(emptyBatch); setBatchItem(null); setScan(null); await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const scanExpiry = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); setError(''); setScan(null)
    try {
      const form = new FormData(); form.append('photo', file)
      const result = await inventoryService.scanExpiry(form)
      setScan(result)
      if (result.expiry_date) setBatchForm(prev => ({ ...prev, expiry_date: result.expiry_date.slice(0, 10) }))
    } catch (e) { setError(e.message) } finally { setScanning(false); e.target.value = '' }
  }

  const refreshRecommendations = async () => {
    setLoadingRecommendations(true)
    try { setRecommendations(await inventoryService.expiryRecommendations()) } catch (e) { setError(e.message) } finally { setLoadingRecommendations(false) }
  }

  return (
    <DashboardLayout role="KITCHEN" title="Inventory">
      <PageHeader title="Raw material inventory" description="    " action={<Button onClick={() => setItemOpen(true)}><Plus size={16} /> Add raw material</Button>} />
      {error && <ErrorState message={error} onRetry={load} />}

      <div className="grid xl:grid-cols-[1.2fr_.8fr] gap-6">
        <Card>
          <CardHeader title="Your inventory" subtitle="   " />
          <CardBody>
            {items === null ? <LoadingState /> : items.length === 0 ? <div className="py-12 text-center"><Boxes className="mx-auto mb-3 text-ink-soft" /><p className="font-medium">No raw materials yet</p><p className="text-sm text-ink-soft mt-1">Add rice, dal, vegetables, oil and other incoming stock.</p></div> : (
              <div className="space-y-3">{items.map(item => (
                <div key={item.id} className="border border-line rounded-md p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-display text-lg">{item.name}</h3><p className="text-sm text-ink-soft">{item.category || 'Raw material'} · {item.quantity} {item.unit}</p></div>
                    <Button size="sm" variant="secondary" onClick={() => setBatchItem(item)}><Plus size={14} /> Add stock</Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge>{expiryLabel(item.expiry_status)}</Badge>
                    {item.next_expiry_date && <span className="text-sm text-ink-soft flex items-center gap-1"><Clock3 size={14} />Expiry: {formatDate(item.next_expiry_date)}</span>}
                    {!item.next_expiry_date && <span className="text-sm text-ink-soft">No expiry date recorded</span>}
                  </div>
                </div>
              ))}</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Use-first recommendation" />
          <CardBody>
            <div className="flex justify-end mb-3"><Button size="sm" variant="secondary" loading={loadingRecommendations} onClick={refreshRecommendations}><Sparkles size={14} /> Refresh</Button></div>
            {recommendations.length === 0 ? <p className="text-sm text-ink-soft">No batches with stock are available for a recommendation.</p> : <div className="space-y-3">{recommendations.slice(0, 8).map((r, index) => <div key={r.batch_id} className={`rounded-md border p-3 ${index === 0 ? 'border-gold-400 bg-gold-50' : 'border-line'}`}><div className="flex justify-between gap-3"><div><p className="font-medium">#{index + 1} · {r.item_name}</p><p className="text-sm text-ink-soft">{r.quantity} {r.unit} · {r.expiry_date ? formatDate(r.expiry_date) : 'No expiry date'}</p></div><Badge>{r.urgency}</Badge></div><p className="text-xs text-ink-soft mt-2">{r.recommendation}</p></div>)}</div>}
          </CardBody>
        </Card>
      </div>

      <Modal open={itemOpen} onClose={() => setItemOpen(false)} title="Add raw material">
        <form onSubmit={createItem} className="space-y-4">
          <Input label="Material name" required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Rice" />
          <Input label="Category" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Grains" />
          <div className="grid grid-cols-2 gap-3"><Input label="Opening quantity" type="number" min="0" step="0.01" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} /><Input label="Unit" required value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} /></div>
          <Input label="Minimum stock" type="number" min="0" step="0.01" value={itemForm.minimum_stock} onChange={e => setItemForm({ ...itemForm, minimum_stock: e.target.value })} />
          <Button type="submit" loading={saving}>Save material</Button>
        </form>
      </Modal>

      <Modal open={!!batchItem} onClose={() => { setBatchItem(null); setScan(null) }} title={batchItem ? `Add stock · ${batchItem.name}` : 'Add stock'}>
        <form onSubmit={addBatch} className="space-y-4">

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setCameraScannerOpen(true)}
              className="gap-1.5"
            >
              <Camera size={16} /> Open Scanner
            </Button>
            <label className="inline-flex cursor-pointer">
              <Button as="span" variant="secondary" loading={scanning} size="sm">
                Upload image
              </Button>
              <input className="hidden" type="file" accept="image/*" onChange={scanExpiry} />
            </label>
          </div>
          {scan && (
            <div className="rounded-md bg-paper-sunken p-3 text-sm border border-line">
              <p className="font-medium text-emerald-800 flex items-center gap-1.5">
                {scan.message}
              </p>
              <p className="text-xs text-ink-soft mt-1">
                Confidence: {Math.round((scan.confidence || 0) * 100)}%
              </p>
              {scan.extracted_text && (
                <pre className="text-[11px] font-mono text-ink-soft whitespace-pre-wrap mt-2 max-h-24 overflow-auto bg-white p-2 rounded border border-line">
                  {scan.extracted_text}
                </pre>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3"><Input label="Quantity" type="number" min="0.01" step="0.01" required value={batchForm.quantity} onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })} /><Input label="Unit" required value={batchForm.unit} onChange={e => setBatchForm({ ...batchForm, unit: e.target.value })} /></div>
          <Input label="Expiry date" type="date" value={batchForm.expiry_date} onChange={e => setBatchForm({ ...batchForm, expiry_date: e.target.value })} hint="    " />
          <Button type="submit" loading={saving}>Add batch</Button>
        </form>
      </Modal>

      {/* Live Camera Scanner Modal */}
      <CameraScanModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onDetected={(detectedDate, res) => {
          setBatchForm((prev) => ({ ...prev, expiry_date: detectedDate }))
          setScan(res)
        }}
      />
    </DashboardLayout>
  )
}
