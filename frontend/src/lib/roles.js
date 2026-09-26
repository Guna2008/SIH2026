// Central definition of platform roles.
// The frontend uses these ONLY for navigation/UI decisions.
// The backend JWT + database role is always the source of truth for authorization.
export const ROLES = {
  NGO: 'NGO',
  ORPHANAGE: 'ORPHANAGE',
  KITCHEN: 'KITCHEN',
  ADMIN: 'ADMIN',
  FOOD_BANK: 'FOOD_BANK',
  INDIVIDUAL: 'INDIVIDUAL',
  BIOGAS_PLANT: 'BIOGAS_PLANT',
}

export const ROLE_HOME_ROUTE = {
  [ROLES.NGO]: '/ngo/dashboard',
  [ROLES.ORPHANAGE]: '/orphanage/dashboard',
  [ROLES.KITCHEN]: '/kitchen/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.FOOD_BANK]: '/food-bank/dashboard',
  [ROLES.INDIVIDUAL]: '/individual/dashboard',
  [ROLES.BIOGAS_PLANT]: '/biogas/dashboard',
}

export const ORG_TYPE_LABEL = {
  NGO: 'Social Welfare Organization',
  ORPHANAGE: 'Social Welfare Organization',
  KITCHEN: 'Institutional Kitchen',
  FOOD_BANK: 'Food Bank',
  INDIVIDUAL: 'Individual / Function Hall',
  BIOGAS_PLANT: 'Biogas Plant',
}

export const ROLE_TITLE = {
  NGO: 'Social Welfare Organization',
  ORPHANAGE: 'Social Welfare Organization',
  KITCHEN: 'Institutional Kitchen',
  ADMIN: 'Platform Admin',
  FOOD_BANK: 'Food Bank',
  INDIVIDUAL: 'Individual / Function Hall',
  BIOGAS_PLANT: 'Biogas Plant',
}

