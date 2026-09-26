import Card, { CardBody } from '../ui/Card'
export default function MealRequirementCard({ meal, required, claimed, accent }) {
  return <Card accent={accent}><CardBody><div className="text-sm text-ink-soft">{meal}</div><div className="text-2xl font-display mt-1">{claimed} / {required}</div><div className="text-xs text-ink-soft mt-1">claimed / required</div></CardBody></Card>
}
