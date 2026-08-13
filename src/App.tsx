import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import SiteGate from "./components/SiteGate";

import WeeklyOverview from "./pages/WeeklyOverview";
import WeeklyDigest from "./pages/WeeklyDigest";
import DetailPage from "./pages/DetailPage";
import ListVotings from "./pages/ListVotings";
import ListAffairs from "./pages/ListAffairs";
import ListMeetings from "./pages/ListMeetings";
import ListBodies from "./pages/ListBodies";
import NotFound from "./pages/NotFound";
import PersonProfile from "./pages/PersonProfile";
import EmbedDetailPage from "./pages/EmbedDetailPage";
import AdminPage from "./pages/AdminPage";
import StoryPage from "./pages/StoryPage";
import TemplateGallery from "./pages/TemplateGallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Embeds bleiben öffentlich zugänglich */}
          <Route path="/embed/:id" element={<EmbedDetailPage />} />
          {/* Referenzgalerie für Screenshot-Regression der Social-Media-Templates */}
          <Route path="/dev/templates" element={<TemplateGallery />} />

          <Route
            element={
              <SiteGate>
                <Outlet />
              </SiteGate>
            }
          >
            <Route path="/" element={<WeeklyDigest />} />
            <Route path="/weekly" element={<WeeklyOverview />} />
            <Route path="/list/votings" element={<ListVotings />} />
            <Route path="/list/affairs" element={<ListAffairs />} />
            <Route path="/list/meetings" element={<ListMeetings />} />
            <Route path="/list/bodies" element={<ListBodies />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/person/:id" element={<PersonProfile />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/story/:id" element={<StoryPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
