import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import Select from '../../components/ui/Select'
import { organizationSignupSchema } from '../../lib/validation'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LocationPicker from '../../components/shared/LocationPicker'
import LocationMap from '../../components/shared/LocationMap'



export default function OrganizationSignupForm({
  role,
  roleMode,
  eyebrow: eyebrowProp,
  title: titleProp,
  subtitle: subtitleProp,
  nameLabel: nameLabelProp,
  capacityLabel: capacityLabelProp,
  capacityHint: capacityHintProp,
}) {
  const { signup } = useAuth()
  const isSocialWelfare = roleMode === 'SOCIAL_WELFARE'
  const roleLabels = {
    FOOD_BANK: { eyebrow: 'Food bank registration', title: 'Register your food bank', nameLabel: 'Food bank name', capacityLabel: 'Collection capacity', capacityHint: 'Maximum meals/portions you can collect or store.' },
    INDIVIDUAL: { eyebrow: 'Individual / function hall registration', title: 'Create your individual account', nameLabel: 'Full name or function hall name', capacityLabel: 'Expected surplus quantity', capacityHint: 'Approximate portions you may share.' },
    BIOGAS_PLANT: { eyebrow: 'Biogas plant registration', title: 'Register your biogas plant', nameLabel: 'Biogas plant name', capacityLabel: 'Waste processing capacity', capacityHint: 'Approximate food waste quantity you can process per day.' },
  }
  const roleCopy = roleLabels[role] || {}
  const [organizationRole, setOrganizationRole] = useState(role || 'NGO')
  const socialWelfareCopy = organizationRole === 'ORPHANAGE'
    ? { nameLabel: 'Orphanage name', capacityLabel: 'Beneficiary capacity', capacityHint: 'Number of residents you serve — used to size meal matching.' }
    : { nameLabel: 'NGO name', capacityLabel: 'Beneficiary capacity', capacityHint: '  ' }
  const eyebrow = eyebrowProp || (isSocialWelfare ? 'Social welfare organization registration' : roleCopy.eyebrow || 'Organization registration')
  const title = titleProp || (isSocialWelfare ? 'Register your social welfare organization' : roleCopy.title || 'Register your organization')
  const subtitle = subtitleProp || (isSocialWelfare ? '    ' : '')
  const nameLabel = nameLabelProp || (isSocialWelfare ? socialWelfareCopy.nameLabel : roleCopy.nameLabel || 'Organization name')
  const capacityLabel = capacityLabelProp || (isSocialWelfare ? socialWelfareCopy.capacityLabel : roleCopy.capacityLabel || 'Beneficiary capacity')
  const capacityHint = capacityHintProp || (isSocialWelfare ? socialWelfareCopy.capacityHint : roleCopy.capacityHint || '')
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(organizationSignupSchema) })

  const latitude = watch('latitude')
  const longitude = watch('longitude')

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await signup({ role: isSocialWelfare ? organizationRole : role, ...values })
      setSubmitted(true)
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.')
    }
  }

  if (submitted) {
    return (
      <AuthLayout eyebrow={eyebrow} title="Registration received">
        <div className="text-center py-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">
            Your account has been submitted with status <strong className="text-ink">PENDING</strong>.
            An administrator will review it before you can access the full platform.
          </p>
          <Button className="mt-6" onClick={() => navigate('/login')}>
            Go to login
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      wide
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSocialWelfare && (
          <Select
            label="Organization type"
            value={organizationRole}
            onChange={(event) => setOrganizationRole(event.target.value)}
            options={[
              { value: 'NGO', label: 'NGO' },
              { value: 'ORPHANAGE', label: 'Orphanage' },
            ]}
          />
        )}
        <Input label={nameLabel} placeholder={nameLabel} error={errors.name?.message} {...register('name')} />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="Enter your mobile number"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />

        <Input label="Address" placeholder="Street, city, state, PIN" error={errors.address?.message} {...register('address')} />

        <div className="pt-1">
          <div className="text-sm font-medium text-ink mb-2">Organization location</div>
          <LocationPicker register={register} setValue={setValue} errors={errors} />
          {latitude != null && longitude != null && <div className="mt-3"><LocationMap latitude={latitude} longitude={longitude} title="Selected organization location" /></div>}
        </div>

        <Input
          label={capacityLabel}
          type="number"
          min="1"
          placeholder="e.g. 200"
          hint={capacityHint}
          error={errors.capacity?.message}
          {...register('capacity')}
        />

        {['NGO', 'ORPHANAGE', 'FOOD_BANK', 'BIOGAS_PLANT', 'INDIVIDUAL'].includes(isSocialWelfare ? organizationRole : role) && <>
          <Input label="Maximum collection distance (km)" type="number" min="1" placeholder="e.g. 25" error={errors.max_distance_km?.message} {...register('max_distance_km')} />
          {((isSocialWelfare ? organizationRole : role) !== 'BIOGAS_PLANT') && <label className="block">
            <span className="block text-sm font-medium text-ink mb-1.5">Food preference</span>
            <select className="w-full rounded-sm border border-line bg-paper-raised px-3.5 py-2.5 text-sm" {...register('food_preferences')}>
              <option value="ANY">Any food (vegetarian or non-vegetarian)</option>
              <option value="VEG">Vegetarian only</option>
              <option value="NON_VEG">Non-vegetarian only</option>
            </select>
          </label>}
        </>}

        <label className="block">
          <span className="block text-sm font-medium text-ink mb-1.5">
            Additional verification details <span className="text-ink-soft font-normal">(optional)</span>
          </span>
          <textarea
            rows={3}
            placeholder="    "
            className="w-full rounded-sm border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            {...register('notes')}
          />
        </label>

        {serverError && (
          <p className="text-sm text-clay-500 bg-clay-50 border border-clay-100 rounded-sm px-3 py-2">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full mt-2" loading={isSubmitting}>
          Submit for review
        </Button>
      </form>
    </AuthLayout>
  )
}
