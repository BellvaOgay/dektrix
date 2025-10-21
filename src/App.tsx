import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { BaseWalletProvider } from "@/providers/BaseWalletProvider";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Videos from "./pages/Videos";

import "./App.css";

function App() {
  return (
    <BaseWalletProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/videos" element={<Videos />} />

            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </BaseWalletProvider>
  );
}

export default App;
