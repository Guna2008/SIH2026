import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { loginSchema } from '../../lib/validation'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function AdminLoginPage() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await adminLogin(values)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Unable to log in with these credentials.')
    }
  }

  return (
    <AuthLayout
      eyebrow="Restricted access"
      title="Admin login"
      subtitle="    "
      footer={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} /> Access is limited to platform administrators
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Admin email"
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

        <Button type="submit" variant="primary" className="w-full mt-2" loading={isSubmitting}>
          Log in as admin
        </Button>
      </form>
    </AuthLayout>
  )
}
