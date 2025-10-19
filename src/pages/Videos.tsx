import Navbar from "@/components/Navbar";
import VideoFeed from "@/components/VideoFeed";
import CategorySection from "@/components/CategorySection";
import { CategoryProvider } from "@/contexts/CategoryContext";

const Videos = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <CategoryProvider>
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gradient mb-4">Video Library</h1>
              <p className="text-muted-foreground text-lg">
                Explore our collection of educational videos. Free content available to all users,
                premium content requires wallet connection.
              </p>
            </div>

            <CategorySection />
            <VideoFeed />
          </div>
        </CategoryProvider>
      </main>
    </div>
  );
};

export default Videos;