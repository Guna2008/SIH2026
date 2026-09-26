import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Soup, Package, HandHeart, Trash2, CheckCircle2, Plus, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/shared/StatCard'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { kitchenService } from '../../services/kitchenService'
import { formatDateTime } from '../../lib/format'

export default function KitchenDashboard() {
  const [stats, setStats] = useState(null)
  const [surplus, setSurplus] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyPin, setVerifyPin] = useState({})
  const [verifying, setVerifying] = useState(null)
  const [verifySuccess, setVerifySuccess] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const [dashData, surplusData, donData] = await Promise.all([
        kitchenService.getDashboard(),
        kitchenService.getSurplus().catch(() => []),
        kitchenService.getDonations().catch(() => []),
      ])
      setStats(dashData)
      setSurplus(Array.isArray(surplusData) ? surplusData : [])
      setDonations(Array.isArray(donData) ? donData : [])
    } catch (e) {
      setError(e.message || 'Could not load kitchen dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleVerify = async (claimId) => {
    const pin = verifyPin[claimId]?.trim()
    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-digit collection PIN provided by the recipient.')
      return
    }
    setVerifying(claimId)
    setError('')
    setVerifySuccess('')
    try {
      await kitchenService.verifyClaim(claimId, pin)
      setVerifySuccess(`Claim #${claimId} collection verified successfully!`)
      setVerifyPin(prev => ({ ...prev, [claimId]: '' }))
      await load()
    } catch (e) {
      setError(e.message || 'Failed to verify PIN. Please double check the code.')
    } finally {
      setVerifying(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="KITCHEN" title="Dashboard">
        <LoadingState label="Loading kitchen operational overview…" />
      </DashboardLayout>
    )
  }

  const pendingPickups = donations.filter(d => d.status === 'CLAIMED')

  return (
    <DashboardLayout role="KITCHEN" title="Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Institutional Kitchen Operations</h2>

        </div>
        <div className="flex items-center gap-2">
          <Link to="/kitchen/surplus">
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Post Surplus
            </Button>
          </Link>
          <Link to="/kitchen/inventory">
            <Button variant="secondary" className="flex items-center gap-2">
              <Boxes size={16} /> Inventory ({stats?.inventory_count || 0})
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {verifySuccess && (
        <div className="mb-5 p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {verifySuccess}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Surplus"
          value={stats?.active_surplus || 0}
          icon={Package}
          accent="#D98D19"
          hint="  "
        />
        <StatCard
          label="Redistributed"
          value={`${stats?.total_redistributed || 0} kg`}
          icon={HandHeart}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Biogas Diversion"
          value={`${stats?.total_waste || 0} kg`}
          icon={Trash2}
          accent="#8B5CF6"
          hint="    "
        />
        <StatCard
          label="Inventory"
          value={stats?.inventory_count || 0}
          icon={Boxes}
          accent="#16834A"
          hint="   "
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Claims Awaiting Collection PIN Verification */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
                <KeyRound size={18} className="text-amber-600" />
                Pickups Awaiting PIN Verification ({pendingPickups.length})
              </h3>
              <Link to="/kitchen/donations" className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium">
                View all history <ArrowRight size={14} />
              </Link>
            </div>

            {pendingPickups.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-6 text-sm text-ink-soft">
                    <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-600" />
                    All scheduled collections are up to date. No pending pickups right now.
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingPickups.map((claim) => (
                  <Card key={claim.id} className="border-amber-200 bg-amber-50/10">
                    <CardBody>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="font-display font-semibold text-sm">
                            {claim.food_title} · {claim.quantity} portions
                          </h4>
                          <p className="text-xs text-ink-soft mt-0.5">
                            Claimed by: <span className="font-medium text-ink">{claim.claimant_name}</span> ({claim.claimant_role})
                          </p>
                          <p className="text-xs text-ink-soft mt-0.5">
                            Claimed at {formatDateTime(claim.created_at)}
                          </p>
                        </div>
                        <Badge variant="warning">Awaiting Pickup</Badge>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center gap-3">
                        <span className="text-xs text-ink-soft">Enter recipient's 4-digit PIN:</span>
                        <div className="w-32">
                          <Input
                            placeholder="••••"
                            maxLength={6}
                            value={verifyPin[claim.id] || ''}
                            onChange={(e) => setVerifyPin({ ...verifyPin, [claim.id]: e.target.value })}
                          />
                        </div>
                        <Button
                          size="sm"
                          loading={verifying === claim.id}
                          onClick={() => handleVerify(claim.id)}
                        >
                          Verify & Complete Handover
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Surplus Listings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-ink">Recent Surplus Postings</h3>
              <Link to="/kitchen/surplus" className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium">
                Manage all surplus <ArrowRight size={14} />
              </Link>
            </div>

            {surplus.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-8">
                    <Package className="mx-auto mb-2 text-ink-soft" size={28} />
                    <p className="font-medium text-sm">No surplus currently listed</p>
                    <p className="text-xs text-ink-soft mt-1">
                      Post leftover meals or expired food to activate automatic redistribution.
                    </p>
                    <Link to="/kitchen/surplus">
                      <Button size="sm" className="mt-3">Post surplus food</Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {surplus.slice(0, 5).map((item) => (
                  <Card key={item.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-medium text-sm">{item.title}</h4>
                            <Badge variant={item.condition === 'ROTTEN' ? 'danger' : 'success'}>
                              {item.condition === 'ROTTEN' ? 'ROTTEN (Biogas)' : 'EDIBLE (Food Bank/NGO)'}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-soft mt-1">
                            Remaining: <span className="font-semibold text-ink">{item.remaining_quantity} / {item.quantity} {item.unit}</span>
                            {item.meal_type && ` · Meal: ${item.meal_type}`}
                          </p>
                        </div>
                        <Badge variant={item.status === 'AVAILABLE' ? 'primary' : 'neutral'}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-ink-soft">
                        Posted {formatDateTime(item.created_at)}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Guide */}
        <div className="space-y-4">
          <Card>
            <CardBody>
              <h4 className="font-display text-sm font-semibold mb-2">Quick Navigation</h4>
              <div className="space-y-2">
                <Link to="/kitchen/inventory" className="block text-xs text-ink hover:text-brand-700 p-2 rounded bg-paper-sunken font-medium">
                  → Expiry Scanner
                </Link>
                <Link to="/kitchen/production" className="block text-xs text-ink hover:text-brand-700 p-2 rounded bg-paper-sunken font-medium">
                  → Daily Production Log
                </Link>
                <Link to="/kitchen/analytics" className="block text-xs text-ink hover:text-brand-700 p-2 rounded bg-paper-sunken font-medium">
                  → Analytics
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
