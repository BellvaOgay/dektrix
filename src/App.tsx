import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { BaseWalletProvider } from "@/providers/BaseWalletProvider";
import { VideoPlayerProvider } from "@/contexts/VideoPlayerContext";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Videos from "./pages/Videos";
import CreatorProfile from "./pages/CreatorProfile";
import GenericVideos from "./pages/GenericVideos";
import AdminManagement from "./pages/AdminManagement";
import AdminUpload from "./pages/AdminUpload";
import PrivateVideo from "./pages/PrivateVideo";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  console.log('App component rendered - console logging is working');
  return (
    <BaseWalletProvider>
      <VideoPlayerProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/generic-videos" element={<GenericVideos />} />
                <Route path="/creator/:wallet" element={<CreatorProfile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:walletAddress" element={<Profile />} />
                <Route path="/admin" element={<AdminManagement />} />
                <Route path="/admin/upload" element={<AdminUpload />} />
                <Route path="/private/:filename" element={<PrivateVideo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </VideoPlayerProvider>
    </BaseWalletProvider>
  );
}

export default App;
