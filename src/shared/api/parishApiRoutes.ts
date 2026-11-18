export function parishApiRoutes(slug: string) {
  if (slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return [];

  const publicParish = `/api/v1/tenants/${slug}`;
  const adminParish = `/api/v1/admin/tenants/${slug}`;
  const publicLinks = `${publicParish}/links`;
  const adminLinks = `${adminParish}/links`;

  return [
    { method: "get", path: publicParish },
    { method: "put", path: adminParish },
    { method: "get", path: publicLinks },
    { method: "post", path: `${publicLinks}/:linkId/click` },
    { method: "get", path: adminLinks },
    { method: "post", path: adminLinks },
    { method: "put", path: `${adminLinks}/:linkId` },
    { method: "delete", path: `${adminLinks}/:linkId` },
  ] as const;
}
