import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import VideoFeed from "@/components/VideoFeed";
import { CategoryProvider } from "@/contexts/CategoryContext";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <CategoryProvider>
          <CategorySection />
          <VideoFeed />
        </CategoryProvider>
      </main>
    </div>
  );
};

export default Index;
