import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PinGate from "./components/PinGate";

import Radar from "./pages/Radar";
import StoryStudio from "./pages/StoryStudio";
import Redaktion from "./pages/Redaktion";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import Profil from "./pages/Profil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Editorial tool stays behind the global PIN; profile & login are public. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profil" element={<Profil />} />
          <Route
            path="*"
            element={
              <PinGate>
                <Routes>
                  <Route path="/" element={<Radar />} />
                  <Route path="/story/:id" element={<StoryStudio />} />
                  <Route path="/redaktion" element={<Redaktion />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PinGate>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
