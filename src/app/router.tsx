import { Navigate, createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminChannelsPage, AdminChurchesPage, AdminDashboardPage, AdminHighlightsPage, AdminHomePage, AdminMorePage, AdminParishPage, AdminSchedulesPage, AdminSettingsPage } from "../features/admin/AdminPages";
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
      { index: true, element: <AdminDashboardPage /> },
      { path: "calendario", element: <AdminCalendarPage /> },
      { path: "igrejas", element: <AdminChurchesPage /> },
      { path: "conteudo", element: <Navigate to="../site/destaques" replace /> },
      { path: "site", element: <Navigate to="pagina-inicial" replace /> },
      { path: "site/pagina-inicial", element: <AdminHomePage /> },
      { path: "site/destaques", element: <AdminHighlightsPage /> },
      { path: "site/canais", element: <AdminChannelsPage /> },
      { path: "mais", element: <AdminMorePage /> },
      { path: "paroquia", element: <AdminParishPage /> },
      { path: "horarios", element: <AdminSchedulesPage /> },
      { path: "configuracoes", element: <AdminSettingsPage /> },
    ],
  },
]);
