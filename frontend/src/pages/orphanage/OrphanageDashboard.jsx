import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Salad, HandHeart, ClipboardList, MapPin, CheckCircle2, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import MealRequirementCard from '../../components/shared/MealRequirementCard'
import StatCard from '../../components/shared/StatCard'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { useAuth } from '../../context/AuthContext'
import { orphanageService } from '../../services/orphanageService'
import { claimService } from '../../services/claimService'
import { formatDateTime } from '../../lib/format'

export default function OrphanageDashboard() {
  const { user } = useAuth()
  const [requirements, setRequirements] = useState(null)
  const [claims, setClaims] = useState(null)
  const [availableFood, setAvailableFood] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setError('')
      const [reqData, claimsData, foodData] = await Promise.all([
        orphanageService.getRequirements().catch(() => []),
        claimService.list().catch(() => []),
        orphanageService.getAvailableFood().catch(() => []),
      ])
      setRequirements(Array.isArray(reqData) ? reqData : [])
      setClaims(Array.isArray(claimsData) ? claimsData : [])
      setAvailableFood(Array.isArray(foodData) ? foodData : [])
    } catch (e) {
      setError(e.message || 'Could not load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="ORPHANAGE" title="Dashboard">
        <LoadingState label="Loading orphanage dashboard…" />
      </DashboardLayout>
    )
  }

  const totalRequired = requirements ? requirements.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0) : 0
  const totalClaimed = claims ? claims.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0) : 0
  const pendingClaims = claims ? claims.filter(c => c.status === 'CLAIMED') : []

  return (
    <DashboardLayout role="ORPHANAGE" title="Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">
            Welcome back{user?.name ? `, ${user.name}` : user?.email ? `, ${user.email}` : ''}
          </h2>

        </div>
        <div className="flex items-center gap-2">
          <Link to="/orphanage/food">
            <Button className="flex items-center gap-2">
              <Salad size={16} /> Available Food ({availableFood?.length || 0})
            </Button>
          </Link>
          <Link to="/orphanage/requirements">
            <Button variant="secondary" className="flex items-center gap-2">
              <ClipboardList size={16} /> Requirements
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Primary KPI Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Available Surplus"
          value={availableFood?.length || 0}
          icon={Salad}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Servings Claimed"
          value={totalClaimed}
          icon={HandHeart}
          accent="#16834A"
          hint="    "
        />
        <StatCard
          label="Pending Pickups"
          value={pendingClaims.length}
          icon={CheckCircle2}
          accent="#D98D19"
          hint="     "
        />
        <StatCard
          label="Total Needed"
          value={totalRequired}
          icon={ClipboardList}
          accent="#D98D19"
          hint="     "
        />
      </div>

      {/* Active Claims & Pickups */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold text-ink">Active Food Claims & Verification PINs</h3>
            <Link to="/orphanage/claims" className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium">
              View all claims <ArrowRight size={14} />
            </Link>
          </div>

          {claims.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <HandHeart className="mx-auto mb-2 text-ink-soft" size={28} />
                  <p className="font-medium text-sm">No active claims yet</p>
                  <p className="text-xs text-ink-soft mt-1">
                    Check out available food posted by institutional kitchens and claim portions for your shelter.
                  </p>
                  <Link to="/orphanage/food">
                    <Button size="sm" className="mt-3">Browse available food</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {claims.slice(0, 4).map((c) => (
                <Card key={c.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-semibold text-sm">
                          {c.food_title || `Surplus Claim #${c.id}`}
                        </h4>
                        <p className="text-xs text-ink-soft mt-0.5">
                          {c.quantity} servings | Provider: {c.kitchen_name || 'Kitchen'}
                        </p>
                      </div>
                      <Badge variant={c.status === 'COMPLETED' ? 'success' : 'primary'}>
                        {c.status}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
                      {c.pin && c.status !== 'COMPLETED' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-ink-soft">PIN:</span>
                          <span className="font-mono font-bold tracking-widest text-sm bg-paper-sunken px-2 py-0.5 rounded border border-line">
                            {c.pin}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-medium">Collection verified & completed</span>
                      )}

                      {c.kitchen_latitude != null && c.kitchen_longitude != null && (
                        <a
                          className="inline-flex items-center gap-1 text-brand-700 hover:underline font-medium"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${c.kitchen_latitude},${c.kitchen_longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin size={13} /> Directions
                        </a>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Food Teaser */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold text-ink">Nearby Surplus</h3>
            <Link to="/orphanage/food" className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {availableFood.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <Salad className="mx-auto mb-2 text-ink-soft" size={28} />
                  <p className="font-medium text-sm">No food ready right now</p>
                  <p className="text-xs text-ink-soft mt-1">
                    Good food is made available after the 30-min priority window. Check back soon!
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {availableFood.slice(0, 3).map((item) => (
                <Card key={item.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-medium text-sm">{item.title}</h4>
                      <Badge>{item.condition || 'GOOD'}</Badge>
                    </div>
                    <div className="text-xs text-ink-soft mt-1">
                      {item.remaining_quantity} servings available
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-ink-soft flex items-center gap-1">
                        <MapPin size={12} /> {item.distance_km != null ? `${item.distance_km} km` : 'Local'}
                      </span>
                      <Link to="/orphanage/food">
                        <Button size="sm">Claim</Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
