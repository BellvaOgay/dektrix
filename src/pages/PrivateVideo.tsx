import Navbar from "@/components/Navbar";

const PrivateVideo = () => {
  const isDev = import.meta.env.DEV;
  const videoSrc = "/api/private-videos/vid%203.MOV"; // URL-encoded space

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-4">Private Video: vid 3</h1>
        <p className="text-muted-foreground mb-6">
          This video is streamed securely from the private_videos folder via the /api/private-videos route.
        </p>

        {isDev && (
          <div className="mb-4 p-3 border rounded text-sm">
            Note: The Vite dev server does not run serverless functions; the video stream may not load locally.
            It will load on your Vercel deployment.
          </div>
        )}

        <div className="max-w-3xl">
          <video
            controls
            preload="metadata"
            className="w-full rounded border"
            src={videoSrc}
            poster="/placeholder.svg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </main>
    </div>
  );
};

export default PrivateVideo;