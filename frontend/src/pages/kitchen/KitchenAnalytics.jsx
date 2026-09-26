import { useCallback, useEffect, useState } from 'react'
import { BarChart3, TrendingUp, HandHeart, Recycle, Sparkles, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import StatCard from '../../components/shared/StatCard'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { kitchenService } from '../../services/kitchenService'

export default function KitchenAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const result = await kitchenService.getAnalytics()
      setData(result)
    } catch (e) {
      setError(e.message || 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="KITCHEN" title="Analytics">
        <LoadingState label="Loading kitchen analytics & waste metrics…" />
      </DashboardLayout>
    )
  }

  const totalFood = data?.total_food || 0
  const totalClaimed = data?.total_claimed || 0
  const goodFood = data?.good_food || 0
  const rottenFood = data?.rotten_food || 0
  const redistributionRate = totalFood > 0 ? Math.round((totalClaimed / totalFood) * 100) : 0

  return (
    <DashboardLayout role="KITCHEN" title="Analytics">
      <PageHeader
        title="Kitchen Waste & Redistribution Analytics"
        description="    "
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Surplus Volume"
          value={`${totalFood} servings`}
          icon={TrendingUp}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Successfully Redistributed"
          value={`${totalClaimed} servings`}
          icon={HandHeart}
          accent="#16834A"
          hint={`${redistributionRate}% redistribution rate`}
        />
        <StatCard
          label="Edible Condition"
          value={`${goodFood} kg`}
          icon={Sparkles}
          accent="#D98D19"
          hint="   "
        />
        <StatCard
          label="Diverted to Biogas"
          value={`${rottenFood} kg`}
          icon={Recycle}
          accent="#8B5CF6"
          hint="    "
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Redistribution Breakdown */}
        <Card>
          <CardBody>
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-600" />
              Surplus Redistribution Performance
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Redistributed ({totalClaimed} servings)</span>
                  <span className="text-emerald-700">{redistributionRate}%</span>
                </div>
                <div className="h-3 bg-paper-sunken rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, redistributionRate)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Edible Good Food ({goodFood} servings)</span>
                  <span className="text-brand-700">
                    {totalFood > 0 ? `${Math.round((goodFood / totalFood) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="h-3 bg-paper-sunken rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${totalFood > 0 ? Math.min(100, Math.round((goodFood / totalFood) * 100)) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Diverted to Biogas ({rottenFood} servings)</span>
                  <span className="text-purple-700">
                    {totalFood > 0 ? `${Math.round((rottenFood / totalFood) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="h-3 bg-paper-sunken rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${totalFood > 0 ? Math.min(100, Math.round((rottenFood / totalFood) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-paper-sunken rounded">
                <div className="text-xs text-ink-soft">Completed Handouts</div>
                <div className="text-xl font-display font-bold text-ink mt-1">
                  {data?.completed_claims || 0}
                </div>
              </div>
              <div className="p-3 bg-paper-sunken rounded">
                <div className="text-xs text-ink-soft">Pending Collections</div>
                <div className="text-xl font-display font-bold text-amber-600 mt-1">
                  {data?.pending_claims || 0}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
