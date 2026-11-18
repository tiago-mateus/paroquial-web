export function parishApiRoutes(slug: string, { churches = false, highlights = false } = {}) {
  if (slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return [];

  const publicParish = `/api/v1/tenants/${slug}`;
  const adminParish = `/api/v1/admin/tenants/${slug}`;
  const publicLinks = `${publicParish}/links`;
  const adminLinks = `${adminParish}/links`;
  const contentRoutes = (resource: "churches" | "banners", id: "churchId" | "bannerId") => [
    { method: "get", path: `${publicParish}/${resource}` },
    { method: "post", path: `${adminParish}/${resource}` },
    { method: "put", path: `${adminParish}/${resource}/:${id}` },
    { method: "delete", path: `${adminParish}/${resource}/:${id}` },
  ] as const;

  return [
    { method: "get", path: publicParish },
    { method: "put", path: adminParish },
    { method: "get", path: publicLinks },
    { method: "post", path: `${publicLinks}/:linkId/click` },
    { method: "get", path: adminLinks },
    { method: "post", path: adminLinks },
    { method: "put", path: `${adminLinks}/:linkId` },
    { method: "delete", path: `${adminLinks}/:linkId` },
    ...(churches ? contentRoutes("churches", "churchId") : []),
    ...(highlights ? [
      { method: "put", path: `${adminParish}/banners/order` } as const,
      ...contentRoutes("banners", "bannerId"),
    ] : []),
  ] as const;
}
