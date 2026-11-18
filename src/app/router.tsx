import { AdminSitePage, AdminParishHubPage, AdminLegacyRedirect } from "../features/admin/AdminTaskHubs";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminChannelsPage, AdminChurchesPage, AdminDashboardPage, AdminHighlightsPage, AdminHomePage, AdminParishPage, AdminSchedulesPage, AdminSettingsPage } from "../features/admin/AdminPages";
import { AdminCalendarPage } from "../features/calendar/AdminCalendarPage";
import { PublicCalendarPage } from "../features/calendar/PublicCalendarPage";
import { PublicChurchesPage } from "../features/churches/PublicChurchesPage";
import { PublicHomePage } from "../features/home/PublicHomePage";
import { LoginPage } from "../features/auth/LoginPage";
import { PublicLinksPage } from "../features/links/PublicLinksPage";
import { PublicLayout } from "./routes";
import { LandingPage } from "../features/marketing/LandingPage";
import { SignupPage } from "../features/subscription/SignupPage";
import { PaymentStatusPage } from "../features/subscription/PaymentStatusPage";
import { SubscriptionPage } from "../features/subscription/SubscriptionPage";
import { WelcomePage } from "../features/subscription/WelcomePage";
import { LegalPage } from "../features/subscription/LegalPage";
import DemoCheckoutPage from "../features/subscription/DemoCheckoutPage";
import { PasswordRecoveryPage } from "../features/auth/PasswordRecoveryPage";
import { RequireAdmin } from "../features/auth/RequireAdmin";

import { demoMode, launchMode } from "../shared/launchMode";
import { LaunchSignupPage } from "../features/subscription/LaunchSignupPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/assinar", element: launchMode ? <LaunchSignupPage /> : <SignupPage /> },
  { path: "/assinatura/confirmacao", element: launchMode ? <Navigate to="/assinar" replace /> : <PaymentStatusPage /> },
  { path: "/termos", element: <LegalPage kind="terms" /> },
  { path: "/privacidade", element: <LegalPage kind="privacy" /> },
  { path: "/recuperar-senha", element: launchMode ? <Navigate to="/login" replace /> : <PasswordRecoveryPage /> },
  { path: "/redefinir-senha", element: launchMode ? <Navigate to="/login" replace /> : <PasswordRecoveryPage reset /> },
  ...(launchMode ? [{ path: "/__demo/pagamento", element: <Navigate to="/assinar" replace /> }] : []),
  ...(demoMode ? [{ path: "/__demo/pagamento", element: <DemoCheckoutPage /> }] : []),
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
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "boas-vindas", element: launchMode ? <Navigate to=".." replace /> : <WelcomePage /> },
      { path: "assinatura", element: launchMode ? <Navigate to=".." replace /> : <SubscriptionPage /> },
      { path: "calendario", element: <AdminCalendarPage /> },
      { path: "igrejas", element: <AdminLegacyRedirect path="paroquia/igrejas" /> },
      { path: "paroquia/igrejas", element: <AdminChurchesPage /> },
      { path: "conteudo", element: <AdminLegacyRedirect path="site/destaques" /> },
      { path: "site", element: <AdminSitePage /> },
      { path: "site/pagina-inicial", element: <AdminHomePage /> },
      { path: "site/destaques", element: <AdminHighlightsPage /> },
      { path: "site/canais", element: <AdminChannelsPage /> },
      { path: "mais", element: <AdminLegacyRedirect path="paroquia" /> },
      { path: "paroquia", element: <AdminParishHubPage /> },
      { path: "paroquia/dados", element: <AdminParishPage /> },
      { path: "horarios", element: <AdminLegacyRedirect path="calendario/confissoes" /> },
      { path: "calendario/confissoes", element: <AdminSchedulesPage /> },
      { path: "configuracoes", element: <AdminLegacyRedirect path="site/status" /> },
      { path: "site/status", element: <AdminSettingsPage /> },
    ],
  },
]);
