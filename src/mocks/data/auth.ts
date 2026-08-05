import { tenants } from "./tenants";

export const currentUser = {
  user: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Administrador",
    email: "admin@paroquial.local",
  },
  adminTenants: tenants.map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    role: "admin",
  })),
};
