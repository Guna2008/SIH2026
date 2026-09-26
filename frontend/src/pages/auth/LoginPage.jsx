import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../../lib/validation'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { ROLE_HOME_ROUTE } from '../../lib/roles'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      const data = await login(values)
      if (data?.role === 'INDIVIDUAL' && navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }))
          const api = (await import('../../services/api')).default
          await api.put('/auth/location', { latitude: position.coords.latitude, longitude: position.coords.longitude })
        } catch {

        }
      }
      const dest = location.state?.from?.pathname || ROLE_HOME_ROUTE[data?.role] || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setServerError(err.message || 'Unable to log in. Check your credentials.')
    }
  }

  return (
    <AuthLayout
      eyebrow="Irai account login"
      title="Welcome back"
      subtitle="    "
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-brand-600 font-medium hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && (
          <p className="text-sm text-clay-500 bg-clay-50 border border-clay-100 rounded-sm px-3 py-2">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full mt-2" loading={isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  )
}
