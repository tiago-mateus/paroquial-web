import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminCalendarPage } from "../features/calendar/AdminCalendarPage";
import { PublicCalendarPage } from "../features/calendar/PublicCalendarPage";
import { PublicChurchesPage } from "../features/churches/PublicChurchesPage";
import { PublicHomePage } from "../features/home/PublicHomePage";
import { LoginPage } from "../features/auth/LoginPage";
import { PublicLinksPage } from "../features/links/PublicLinksPage";
import { PublicLayout } from "./routes";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/:tenantSlug",
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHomePage /> },
      { path: "calendario", element: <PublicCalendarPage /> },
      { path: "igrejas", element: <PublicChurchesPage /> },
      { path: "links", element: <PublicLinksPage /> },
    ],
  },
  {
    path: "/:tenantSlug/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="calendario" replace /> },
      { path: "calendario", element: <AdminCalendarPage /> },
    ],
  },
]);
