import { useEffect, useState } from 'react'
import { Salad, HandHeart, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card, { CardBody } from '../../components/ui/Card'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { ngoService } from '../../services/ngoService'

export default function NgoDashboard() {
    const [data, setData] = useState(null); const [error, setError] = useState('')
    const load = async () => { try { setError(''); const [food, claims] = await Promise.all([ngoService.getAvailableFood(), ngoService.getClaims()]); setData({ food, claims }) } catch (e) { setError(e.message) } }
    useEffect(() => { load() }, [])
    return <DashboardLayout role="NGO" title="Dashboard">{error && <ErrorState message={error} onRetry={load} />} {!data ? <LoadingState /> : <div className="grid md:grid-cols-3 gap-5"><Card accent="#16834A"><CardBody><Salad className="text-brand-700" /><div className="text-3xl font-display mt-3">{data.food.length}</div><div className="text-sm text-ink-soft">Available meals</div></CardBody></Card><Card accent="#D98D19"><CardBody><HandHeart className="text-brand-700" /><div className="text-3xl font-display mt-3">{data.claims.length}</div><div className="text-sm text-ink-soft">My claims</div></CardBody></Card></div>}</DashboardLayout>
}
