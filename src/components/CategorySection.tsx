import { Bot, TrendingUp, Coins, Image, Lock, Zap, Layers } from "lucide-react";
import CategoryPill from "./CategoryPill";
import { useCategory } from "@/contexts/CategoryContext";

const categories = [
  { id: "all", icon: Zap, label: "All" },
  { id: "ai", icon: Bot, label: "AI Agents" },
  { id: "defi", icon: TrendingUp, label: "DeFi" },
  { id: "nfts", icon: Image, label: "NFTs" },
  { id: "prediction", icon: Coins, label: "Prediction Markets" },
  { id: "web3 security", icon: Lock, label: "Web3 Security" },
  { id: "blockchain", icon: Layers, label: "Blockchain" },
];

const CategorySection = () => {
  const { selectedCategory, setSelectedCategory } = useCategory();

  return (
    <section className="py-12 border-b border-border">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Choose Your Chaos</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <CategoryPill
              key={category.id}
              icon={category.icon}
              label={category.label}
              active={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
