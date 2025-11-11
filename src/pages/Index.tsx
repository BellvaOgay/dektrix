import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import VideoFeed from "@/components/VideoFeed";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";

const Index = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />

        {/* Buy Credits Button */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center mb-8">
            <BuyCreditsButton />
          </div>
        </div>

        <CategoryProvider>
          <CategorySection />
          <VideoFeed />
        </CategoryProvider>
      </main>
    </div>
  );
};

export default Index;
