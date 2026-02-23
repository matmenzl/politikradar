import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import WeeklyOverview from "./pages/WeeklyOverview";
import WeeklyDigest from "./pages/WeeklyDigest";
import DetailPage from "./pages/DetailPage";
import ListVotings from "./pages/ListVotings";
import ListAffairs from "./pages/ListAffairs";
import ListMeetings from "./pages/ListMeetings";
import ListBodies from "./pages/ListBodies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WeeklyDigest />} />
          <Route path="/weekly" element={<WeeklyOverview />} />
          <Route path="/list/votings" element={<ListVotings />} />
          <Route path="/list/affairs" element={<ListAffairs />} />
          <Route path="/list/meetings" element={<ListMeetings />} />
          <Route path="/list/bodies" element={<ListBodies />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
