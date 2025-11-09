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

      {/* Test button for modal functionality */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setShowModal(true)}>
          Test Modal
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Modal</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>This is a test modal for functionality verification.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
