import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";
import DonatePage from "./pages/donate/page.tsx";
import IndexPage from "./pages/Index.tsx";
import ThankYouPage from "./pages/thank-you/page.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrivacyPage from "./pages/privacy/page.tsx";
import TermsPage from "./pages/terms/page.tsx";
import RefundPolicyPage from "./pages/refund-policy/page.tsx";
import CookiePolicyPage from "./pages/cookie-policy/page.tsx";
import HelpPage from "./pages/help/page.tsx";
import ContactPage from "./pages/contact/page.tsx";
import ReportIssuePage from "./pages/report-issue/page.tsx";
import CampaignPage from "./pages/campaign/page.tsx";
import PortalLayout, {
  PortalUnauthenticated,
  PortalAuthLoading,
} from "./pages/portal/_components/portal-layout.tsx";
import PermissionGuard from "./pages/portal/_components/permission-guard.tsx";
import PortalDashboard from "./pages/portal/page.tsx";
import CampaignsListPage from "./pages/portal/campaigns/page.tsx";
import NewCampaignPage from "./pages/portal/campaigns/new/page.tsx";
import CampaignDetailPage from "./pages/portal/campaigns/detail/page.tsx";
import PrestigePage from "./pages/portal/quota/page.tsx";
import StaffListPage from "./pages/portal/staff/page.tsx";
import StaffDetailPage from "./pages/portal/staff/detail/page.tsx";
import AnalyticsPage from "./pages/portal/analytics/page.tsx";
import PrestigeManagementPage from "./pages/portal/prestige/page.tsx";
import LeaderboardPage from "./pages/portal/leaderboard/page.tsx";
import FinancePage from "./pages/portal/finance/page.tsx";
import AboutPage from "./pages/about/page.tsx";
import CampaignsBrowsePage from "./pages/campaigns/page.tsx";
import CampaignGuidePage from "./pages/campaign-guide/page.tsx";
import StartCampaignPage from "./pages/start-campaign/page.tsx";
import StartCampaignSuccessPage from "./pages/start-campaign/success/page.tsx";
import LoginPage from "./pages/login/page.tsx";
import DonorDashboardPage from "./pages/dashboard/page.tsx";

import DonorsPage from "./pages/portal/donors/page.tsx";
import DonorDetailPage from "./pages/portal/donors/detail/page.tsx";
import ProfilePage from "./pages/portal/profile/page.tsx";
import MetaAssetsPage from "./pages/portal/meta-assets/page.tsx";
import ShopifyImportPage from "./pages/portal/shopify-import/page.tsx";
import ProcessorsPage from "./pages/portal/processors/page.tsx";
import NewProcessorPage from "./pages/portal/processors/new/page.tsx";

export default function App() {
  useServiceWorker();

  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DonorDashboardPage />} />

          {/* Public campaigns browse */}
          <Route path="/campaigns" element={<CampaignsBrowsePage />} />

          {/* Campaign guide */}
          <Route path="/campaign-guide" element={<CampaignGuidePage />} />

          {/* Help & support */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/report-issue" element={<ReportIssuePage />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />

          {/* Public campaign wizard */}
          <Route path="/start-campaign" element={<StartCampaignPage />} />
          <Route path="/start-campaign/success" element={<StartCampaignSuccessPage />} />

          {/* Public campaign pages */}
          <Route path="/campaign/:slug" element={<CampaignPage />} />

          {/* Employee portal */}
          <Route
            path="/portal"
            element={
              <>
                <PortalAuthLoading />
                <PortalUnauthenticated />
                <PortalLayout />
              </>
            }
          >
            <Route index element={<PermissionGuard permission="dashboard"><PortalDashboard /></PermissionGuard>} />
            <Route path="campaigns" element={<PermissionGuard permission="campaigns"><CampaignsListPage /></PermissionGuard>} />
            <Route path="campaigns/new" element={<PermissionGuard permission="new_campaign"><NewCampaignPage /></PermissionGuard>} />
            <Route path="campaigns/:id" element={<PermissionGuard permission="campaigns"><CampaignDetailPage /></PermissionGuard>} />
            <Route path="quota" element={<PermissionGuard permission="my_prestige"><PrestigePage /></PermissionGuard>} />
            <Route path="staff" element={<PermissionGuard permission="staff"><StaffListPage /></PermissionGuard>} />
            <Route path="staff/:userId" element={<PermissionGuard permission="staff"><StaffDetailPage /></PermissionGuard>} />
            <Route path="prestige" element={<PermissionGuard permission="prestige"><PrestigeManagementPage /></PermissionGuard>} />
            <Route path="leaderboard" element={<PermissionGuard permission="leaderboard"><LeaderboardPage /></PermissionGuard>} />
            <Route path="analytics" element={<PermissionGuard permission="analytics"><AnalyticsPage /></PermissionGuard>} />
            <Route path="finance" element={<PermissionGuard permission="finance"><FinancePage /></PermissionGuard>} />

            <Route path="donors" element={<PermissionGuard permission="donors"><DonorsPage /></PermissionGuard>} />
            <Route path="donors/:donationId" element={<PermissionGuard permission="donors"><DonorDetailPage /></PermissionGuard>} />
            <Route path="meta-assets" element={<PermissionGuard permission="meta_assets"><MetaAssetsPage /></PermissionGuard>} />
            <Route path="shopify-import" element={<PermissionGuard permission="meta_assets"><ShopifyImportPage /></PermissionGuard>} />
            <Route path="processors" element={<PermissionGuard permission="processors"><ProcessorsPage /></PermissionGuard>} />
            <Route path="processors/new" element={<PermissionGuard permission="processors"><NewProcessorPage /></PermissionGuard>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
