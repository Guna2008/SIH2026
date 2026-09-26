import { useCallback, useEffect, useState } from 'react'
import {
  BarChart3, Sprout, TrendingUp, HandHeart, Recycle, Building2,
  Users, Soup, Warehouse, CheckCircle2,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import StatCard from '../../components/shared/StatCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await adminService.getAnalytics()
      setData(result)
    } catch (e) {
      setError(e.message || 'Could not load platform analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Analytics">
        <LoadingState label="Calculating platform-wide analytics & environmental metrics…" />
      </DashboardLayout>
    )
  }

  const mealsRedistributed = data?.meals_redistributed || 0
  const totalFoodProduced = data?.total_food_produced || 0
  const wasteReduction = data?.waste_reduction || '0%'

  // Environmental calculations
  const co2AvoidedKg = Math.round(mealsRedistributed * 2.5) // ~2.5 kg CO2e per kg food waste avoided
  const waterSavedLiters = Math.round(mealsRedistributed * 250) // ~250 L water saved per kg meal

  return (
    <DashboardLayout role="ADMIN" title="Analytics">
      <PageHeader
        title="Platform-Wide Redistribution & Impact Analytics"
        description="    "
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Primary KPI Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Surplus Listed"
          value={`${totalFoodProduced} kg`}
          icon={TrendingUp}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Redistributed to Date"
          value={`${mealsRedistributed} kg`}
          icon={HandHeart}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Redistribution Rate"
          value={wasteReduction}
          icon={Sprout}
          accent="#16834A"
          hint="    "
        />
        <StatCard
          label="CO₂ Emissions Prevented"
          value={`${co2AvoidedKg} kg`}
          icon={Recycle}
          accent="#8B5CF6"
          hint="     "
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Network Participation by Role */}
        <Card>
          <CardBody>
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              Network Participation by Role
            </h3>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Institutional Kitchens</div>
                </div>
                <div className="text-xl font-display font-bold text-ink">
                  {data?.kitchens ?? 0}
                </div>
              </div>

              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Social Welfare NGOs</div>
                </div>
                <div className="text-xl font-display font-bold text-ink">
                  {data?.ngos ?? 0}
                </div>
              </div>

              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Orphanages & Homes</div>

                </div>
                <div className="text-xl font-display font-bold text-ink">
                  {data?.orphanages ?? 0}
                </div>
              </div>

              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Food Banks</div>

                </div>
                <div className="text-xl font-display font-bold text-ink">
                  {data?.food_banks ?? 0}
                </div>
              </div>

              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Biogas Plants</div>

                </div>
                <div className="text-xl font-display font-bold text-purple-700">
                  {data?.biogas_plants ?? 0}
                </div>
              </div>

              <div className="p-3 bg-paper-sunken rounded border border-line flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink">Individual Donors</div>

                </div>
                <div className="text-xl font-display font-bold text-ink">
                  {data?.individuals ?? 0}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Environmental & Ecological Impact */}
        <Card>
          <CardBody>
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Recycle size={18} className="text-emerald-600" />
              Circular Economy & Ecological Impact
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-sm bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 text-sm">Carbon Offset</span>
                  <span className="font-display font-bold text-emerald-800 text-lg">{co2AvoidedKg} kg CO₂e</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">

                </p>
              </div>



              <div className="p-4 rounded-sm bg-purple-50 border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-900 text-sm">Clean Methane Diversion</span>
                  <span className="font-display font-bold text-purple-800 text-lg">100% Inedible Waste Routed</span>
                </div>

              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
