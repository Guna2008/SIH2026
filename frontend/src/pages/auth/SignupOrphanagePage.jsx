import OrganizationSignupForm from './OrganizationSignupForm'

export default function SignupOrphanagePage() {
  return (
    <OrganizationSignupForm
      role="ORPHANAGE"
      eyebrow="Orphanage registration"
      title="Register your orphanage"
      subtitle="Tell us about your facility so we can verify it and match you with surplus food."
      nameLabel="Orphanage name"
      capacityLabel="Beneficiary capacity"
      capacityHint="Number of residents — used to size your default meal requirements."
    />
  )
}
