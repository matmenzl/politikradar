import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "./components/AuthGate";

import Radar from "./pages/Radar";
import StoryStudio from "./pages/StoryStudio";
import Redaktion from "./pages/Redaktion";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import Profil from "./pages/Profil";
import PublicEvent from "./pages/PublicEvent";
import PublicStory from "./pages/PublicStory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Editorial tool requires a login; profile & login pages are public. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/g/:id" element={<PublicEvent />} />
          <Route path="/s/:id" element={<PublicStory />} />
          <Route path="/__slidetest" element={<SlideTest />} />

          <Route
            path="*"
            element={
              <AuthGate>
                <Routes>
                  <Route path="/" element={<Radar />} />
                  <Route path="/story/:id" element={<StoryStudio />} />
                  <Route path="/redaktion" element={<Redaktion />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
