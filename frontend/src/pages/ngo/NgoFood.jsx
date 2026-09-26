import { useCallback, useEffect, useState } from 'react'
import { Salad, MapPin, Sparkles, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Card, { CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import { ngoService } from '../../services/ngoService'
import { claimService } from '../../services/claimService'
import { formatDateTime } from '../../lib/format'
import { mediaUrl } from '../../lib/media'
import { useAuth } from '../../context/AuthContext'

export default function NgoFood() {
  const { user } = useAuth()
  const [foods, setFoods] = useState(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState({})
  const [claiming, setClaiming] = useState(null)
  const [success, setSuccess] = useState(null)

  const userCapacity = user?.capacity || 0
  const maxClaimLimit = userCapacity > 0 ? userCapacity + 15 : null

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await ngoService.getAvailableFood()
      setFoods(Array.isArray(result) ? result : [])
    } catch (e) {
      setError(e.message || 'Could not load available food')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const claim = async (food) => {
    const rawQty = Number(qty[food.id] || (maxClaimLimit ? Math.min(food.remaining_quantity, maxClaimLimit) : food.remaining_quantity))
    if (!Number.isFinite(rawQty) || rawQty <= 0) return setError('Enter a valid quantity')
    if (rawQty > food.remaining_quantity) return setError('Quantity exceeds remaining food')
    if (maxClaimLimit && rawQty > maxClaimLimit) {
      return setError(`You cannot claim this much. Your capacity is ${userCapacity} with an extra 15 meals buffer, so the maximum you can claim is ${maxClaimLimit} meals.`)
    }
    setClaiming(food.id); setError(''); setSuccess(null)
    try {
      const result = await claimService.claim(food.id, rawQty)
      setSuccess(result)
      await load()
    } catch (e) {
      setError(e.message || 'Could not claim this food')
    } finally { setClaiming(null) }
  }

  return (
    <DashboardLayout role="NGO" title="Available food">
      <PageHeader
        title="Surplus Meals"
        description="     "
      />

      {/* Rules Notice Banner */}
      <div className="mb-6 p-4 rounded-sm bg-brand-50 border border-brand-200 text-xs text-brand-900 space-y-1.5">
        <div className="font-semibold flex items-center gap-1.5 text-sm">
          <Clock size={13} /> Meal Window Timings
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-ink-soft">
          <div>• <strong>Breakfast:</strong> Closes at 11:00 AM</div>
          <div>• <strong>Lunch:</strong> Closes at 5:00 PM</div>
          <div>• <strong>Dinner:</strong> Closes at 10:00 PM</div>
          <div>• <strong>Collection Limit:</strong> Up to Capacity + 15 {maxClaimLimit && `(${maxClaimLimit} servings)`}</div>
        </div>

      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {success && (
        <Card className="mb-6" accent="#16834A">
          <CardBody>
            <h3 className="font-display text-lg">Claim confirmed</h3>
            <p className="text-sm text-ink-soft mt-1">{success.food_title} · {success.quantity} portions</p>
            <div className="mt-4 text-3xl font-display tracking-[0.3em]">{success.pin}</div>
            <p className="text-xs text-ink-soft mt-2">Show this PIN to the kitchen coordinator during food collection.</p>
          </CardBody>
        </Card>
      )}

      {foods === null ? (
        <LoadingState label="Loading AI-recommended food for your organization…" />
      ) : foods.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-10">
              <Salad className="mx-auto mb-3 text-ink-soft" size={32} />
              <p className="font-medium">No eligible food available right now</p>
              <p className="text-sm text-ink-soft mt-1 max-w-lg mx-auto">
                Good surplus appears here after the 30-minute food bank priority window, before the meal cutoffs (Breakfast 11 AM, Lunch 5 PM, Dinner 10 PM).
              </p>
              <Button className="mt-4" onClick={load}>Refresh listings</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {foods.map(food => {
            const maxAllowed = maxClaimLimit ? Math.min(food.remaining_quantity, maxClaimLimit) : food.remaining_quantity
            return (
              <Card key={food.id} className="overflow-hidden flex flex-col justify-between">
                {food.photo_url && <img src={mediaUrl(food.photo_url)} alt={food.title} className="w-full h-44 object-cover" />}
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{food.title}</h3>
                      <p className="text-xs text-ink-soft mt-0.5">{food.meal_type || 'General meal'} · {food.food_type || 'Any'}</p>
                    </div>
                    <Badge variant={food.condition === 'ROTTEN' ? 'danger' : 'success'}>
                      {food.condition || 'GOOD'}
                    </Badge>
                  </div>

                  {food.match_score != null && (
                    <div className="mt-2.5">
                      <Badge variant="gold" className="flex items-center gap-1 w-fit text-[11px]">
                        <Sparkles size={12} /> AI Match: {Math.round(food.match_score)}%
                      </Badge>
                    </div>
                  )}

                  {food.description && <p className="text-xs text-ink-soft mt-2">{food.description}</p>}

                  <div className="mt-3 space-y-1 text-xs text-ink-soft border-t border-line pt-2">
                    <p><strong>Available:</strong> <span className="font-semibold text-ink">{food.remaining_quantity} servings </span></p>
                    <p className="flex items-center gap-1"><MapPin size={13} /> {food.distance_km == null ? 'Local radius' : `${food.distance_km} km away`}</p>
                    {food.expiry_date && <p><strong>Expires:</strong> {formatDateTime(food.expiry_date)}</p>}
                    {food.match_reason && <p className="text-brand-700 italic mt-1 font-medium">{food.match_reason}</p>}
                  </div>

                  <div className="mt-4 flex gap-2 items-end pt-2 border-t border-line">
                    <div className="flex-1">
                      <label className="text-[11px] text-ink-soft block mb-1">
                        Quantity {maxClaimLimit && `(max: ${maxAllowed} servings)`}
                      </label>
                      <Input
                        type="number"
                        min="0.1"
                        max={maxAllowed}
                        step="any"
                        value={qty[food.id] ?? maxAllowed}
                        onChange={e => setQty(old => ({ ...old, [food.id]: e.target.value }))}
                      />
                    </div>
                    <Button disabled={claiming === food.id} onClick={() => claim(food)}>
                      {claiming === food.id ? 'Claiming…' : 'Claim'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
