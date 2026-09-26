import OrganizationSignupForm from './OrganizationSignupForm'

export default function SignupNgoPage() {
  return (
    <OrganizationSignupForm
      role="NGO"
      eyebrow="NGO registration"
      title="Register your NGO"
      subtitle="Tell us about your organization so we can verify it and match you with surplus food."
      nameLabel="Organization name"
      capacityLabel="Beneficiary capacity"
      capacityHint="Roughly how many people you serve per day — used to size your default meal requirements."
    />
  )
}
