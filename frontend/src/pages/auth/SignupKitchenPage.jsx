import OrganizationSignupForm from './OrganizationSignupForm'

export default function SignupKitchenPage() {
  return (
    <OrganizationSignupForm
      role="KITCHEN"
      eyebrow="Kitchen registration"
      title="Register your kitchen"
      subtitle="    "
      nameLabel="Institution / kitchen name"
      capacityLabel="Kitchen capacity"
      capacityHint="Approximate meals produced per meal time at full capacity."
    />
  )
}
