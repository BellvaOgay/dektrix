import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import VideoFeed from "@/components/VideoFeed";
import { CategoryProvider } from "@/contexts/CategoryContext";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* TESTING: Add a simple test button for modal functionality */}
      <div className="fixed top-4 left-4 z-50 bg-blue-500 text-white p-2 rounded">
        <button 
          onClick={() => {
            console.log('TEST BUTTON: Attempting to open modal...');
            // Find the first VideoCard and trigger its modal
            const firstCard = document.querySelector('[data-video-id]') as HTMLElement;
            if (firstCard) {
              console.log('Found video card:', firstCard);
              firstCard.click();
            } else {
              console.log('No video card found');
            }
          }}
        >
          TEST MODAL BUTTON
        </button>
      </div>

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
