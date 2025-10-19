import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroCyber from "@/assets/hero-cyber.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden" aria-label="Hero">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${heroCyber})` }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-20 text-center space-y-8">
        <h1 className="text-4xl md:text-7xl font-black leading-tight">
          Learn Complex Sh*t
          <br />
          <span className="text-gradient">Through Dektrix</span>
        </h1>

        <p className="text-base md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Macro-learning in Micro-payment. Unlock bite-sized videos that make AI agents, DeFi, and blockchain actually make sense. TikTok vibes, PhD knowledge.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button variant="cyber" size="lg" className="text-lg" aria-label="Start Learning">
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="text-lg" aria-label="Browse Topics">
            Browse Topics
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm" aria-label="Highlights">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-gradient">30s</div>
            <div className="text-muted-foreground">Avg. Video</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-gradient">$0.01</div>
            <div className="text-muted-foreground">Micro Tips</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-gradient">100%</div>
            <div className="text-muted-foreground">Dektrix</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
