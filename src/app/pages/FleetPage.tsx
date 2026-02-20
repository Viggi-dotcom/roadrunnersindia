import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bike,
  Shield,
  AlertTriangle,
  Check,
  X,
  HardHat,
  Shirt,
  Droplets,
  Mountain,
  GitCompare,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api } from "../lib/api";
import { toast } from "sonner";

// ── Bike Comparison Modal ─────────────────────────────────────────────────────
function CompareModal({
  bikes,
  onClose,
}: {
  bikes: [any, any];
  onClose: () => void;
}) {
  const [a, b] = bikes;

  const difficultyBg = (val: string) => {
    if (!val) return "bg-[#333]";
    const lower = val.toLowerCase();
    if (lower.includes("high") || lower.includes("mountain")) return "bg-[#D85A21]/20 text-[#D85A21]";
    return "bg-[#333] text-[#999]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#1A1A1A] border-2 border-[#333] w-full max-w-4xl my-4"
      >
        {/* Header */}
        <div className="bg-[#111] border-b-2 border-[#D85A21] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#D85A21]" strokeWidth={2.5} />
            <h2 className="font-['Oswald'] text-xl font-bold text-[#F4F4F5]">BIKE COMPARISON</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#666] hover:text-[#F4F4F5] hover:bg-[#242424] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Bike names + images */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {[a, b].map((bike, idx) => (
              <div key={idx} className="text-center">
                <div className="h-40 overflow-hidden border-2 border-[#333] mb-3">
                  <ImageWithFallback
                    src={bike.image}
                    alt={bike.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">{bike.name}</h3>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {bike.terrain?.map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-[#333] text-[#D85A21] font-['Oswald'] tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side pros */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {[a, b].map((bike, idx) => (
              <div key={idx} className="border-2 border-[#333] bg-[#242424] p-4">
                <h4 className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00] mb-3 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  PROS
                </h4>
                <ul className="space-y-2">
                  {bike.pros?.map((pro: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#CCC]">
                      <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {pro}
                    </li>
                  ))}
                  {(!bike.pros || bike.pros.length === 0) && (
                    <li className="text-[#555] text-xs">No data</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Side-by-side cons */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {[a, b].map((bike, idx) => (
              <div key={idx} className="border-2 border-[#333] bg-[#242424] p-4">
                <h4 className="font-['Oswald'] text-xs tracking-widest text-[#D85A21] mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  CONS
                </h4>
                <ul className="space-y-2">
                  {bike.cons?.map((con: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#CCC]">
                      <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {con}
                    </li>
                  ))}
                  {(!bike.cons || bike.cons.length === 0) && (
                    <li className="text-[#555] text-xs">No data</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-6">
            {[a, b].map((bike, idx) => (
              <div key={idx} className="text-xs text-[#999] leading-relaxed border-l-2 border-[#333] pl-3">
                {bike.description}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#333] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all"
          >
            CLOSE COMPARISON
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main FleetPage ────────────────────────────────────────────────────────────
export function FleetPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bikes" | "gear" | "advisory">("bikes");

  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        await api.seed();
        const data = await api.getFleet();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error loading fleet:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const bikes = items.filter((i) => i.category === "bike");
  const gear = items.filter((i) => i.category === "gear");
  const advisories = items.filter((i) => i.category === "advisory");

  const toggleCompare = (bikeId: string) => {
    setCompareList((prev) => {
      if (prev.includes(bikeId)) return prev.filter((id) => id !== bikeId);
      if (prev.length >= 2) {
        toast.error("Select only 2 bikes to compare");
        return prev;
      }
      return [...prev, bikeId];
    });
  };

  const compareBikes = compareList.map((id) => bikes.find((b) => b.id === id)).filter(Boolean);

  const tabIcon = (tab: string) => {
    switch (tab) {
      case "bikes": return Bike;
      case "gear": return Shield;
      case "advisory": return Mountain;
      default: return Bike;
    }
  };

  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="bg-[#111] border-b-2 border-[#333] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="font-['Oswald'] text-xs tracking-widest text-[#D85A21]">
            KNOWLEDGE IS ARMOR
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Oswald'] font-bold mt-2">
            FLEET & <span className="text-[#D85A21]">GEAR ADVISORY</span>
          </h1>
          <p className="text-[#999] text-lg mt-4 max-w-xl">
            Expert recommendations on motorcycles, riding gear, and high-altitude preparation. Built from years of real expedition data.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {(["bikes", "gear", "advisory"] as const).map((tab) => {
            const Icon = tabIcon(tab);
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab !== "bikes") {
                    setCompareMode(false);
                    setCompareList([]);
                  }
                }}
                className={`flex items-center gap-2 px-5 py-3 font-['Oswald'] text-sm tracking-wider border-2 transition-colors flex-shrink-0 ${
                  activeTab === tab
                    ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                    : "border-[#333] text-[#999] hover:border-[#D85A21] hover:text-[#D85A21]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {tab === "bikes" ? "RECOMMENDED BIKES" : tab === "gear" ? "ESSENTIAL GEAR" : "EXPERT ADVISORY"}
              </button>
            );
          })}

          {/* Compare toggle — only in bikes tab */}
          {activeTab === "bikes" && bikes.length >= 2 && (
            <button
              onClick={() => {
                setCompareMode((v) => !v);
                if (compareMode) setCompareList([]);
              }}
              className={`ml-auto flex items-center gap-2 px-4 py-3 font-['Oswald'] text-sm tracking-wider border-2 transition-colors flex-shrink-0 ${
                compareMode
                  ? "bg-[#E5FF00] border-[#E5FF00] text-[#1A1A1A]"
                  : "border-[#333] text-[#666] hover:border-[#E5FF00] hover:text-[#E5FF00]"
              }`}
            >
              <GitCompare className="w-4 h-4" strokeWidth={2.5} />
              {compareMode ? "CANCEL COMPARE" : "COMPARE BIKES"}
            </button>
          )}
        </div>

        {/* Compare action bar */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 border-2 border-[#E5FF00]/40 bg-[#E5FF00]/5 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-['Oswald'] text-sm text-[#E5FF00] tracking-wider">
                  SELECT 2 BIKES TO COMPARE
                </p>
                <p className="text-[#666] text-xs mt-0.5">
                  {compareList.length === 0 && "Click the checkbox on any bike card"}
                  {compareList.length === 1 && "Select one more bike"}
                  {compareList.length === 2 && "Ready! Click COMPARE NOW →"}
                </p>
              </div>
              <button
                onClick={() => setShowCompare(true)}
                disabled={compareList.length !== 2}
                className="flex items-center gap-2 px-5 py-3 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <GitCompare className="w-4 h-4" strokeWidth={2.5} />
                COMPARE NOW ({compareList.length}/2)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-[#242424] animate-pulse border-2 border-[#333]" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Bikes ── */}
            {activeTab === "bikes" && (
              <div className="space-y-8">
                {bikes.map((bike, idx) => {
                  const isSelected = compareList.includes(bike.id);
                  return (
                    <motion.div
                      key={bike.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`border-2 bg-[#242424] overflow-hidden transition-colors ${
                        compareMode
                          ? isSelected
                            ? "border-[#E5FF00]"
                            : "border-[#333] hover:border-[#E5FF00]/40"
                          : "border-[#333]"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        {/* Image + compare overlay */}
                        <div className="relative h-64 md:h-auto">
                          <ImageWithFallback
                            src={bike.image}
                            alt={bike.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#242424]/50 hidden md:block" />

                          {/* Compare checkbox */}
                          {compareMode && (
                            <button
                              onClick={() => toggleCompare(bike.id)}
                              className={`absolute top-3 left-3 w-8 h-8 border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[#E5FF00] border-[#E5FF00]"
                                  : "bg-[#1A1A1A]/80 border-[#666] hover:border-[#E5FF00]"
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-[#1A1A1A]" strokeWidth={3} />}
                            </button>
                          )}
                        </div>

                        <div className="md:col-span-2 p-6">
                          <h3 className="font-['Oswald'] text-2xl font-bold text-[#F4F4F5] mb-2">
                            {bike.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {bike.terrain?.map((t: string) => (
                              <span key={t} className="px-2 py-1 bg-[#333] text-xs font-['Oswald'] tracking-wider text-[#D85A21]">
                                {t}
                              </span>
                            ))}
                          </div>
                          <p className="text-[#999] text-sm mb-6 leading-relaxed">{bike.description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-['Oswald'] text-sm tracking-wider text-[#E5FF00] mb-3 flex items-center gap-2">
                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                PROS
                              </h4>
                              <ul className="space-y-2">
                                {bike.pros?.map((pro: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-[#CCC]">
                                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-['Oswald'] text-sm tracking-wider text-[#D85A21] mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                                CONS
                              </h4>
                              <ul className="space-y-2">
                                {bike.cons?.map((con: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-[#CCC]">
                                    <X className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {compareMode && (
                            <button
                              onClick={() => toggleCompare(bike.id)}
                              className={`mt-4 flex items-center gap-2 px-4 py-2 font-['Oswald'] text-xs tracking-wider border-2 transition-colors ${
                                isSelected
                                  ? "border-[#E5FF00] text-[#E5FF00] bg-[#E5FF00]/10"
                                  : "border-[#333] text-[#666] hover:border-[#E5FF00] hover:text-[#E5FF00]"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  SELECTED FOR COMPARE
                                </>
                              ) : (
                                <>
                                  <GitCompare className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  ADD TO COMPARE
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Gear ── */}
            {activeTab === "gear" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gear.map((item, idx) => {
                  const icons: Record<string, any> = {
                    "helmet-guide": HardHat,
                    "riding-jacket": Shirt,
                    "hydration-pack": Droplets,
                  };
                  const Icon = icons[item.id] || Shield;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border-2 border-[#333] bg-[#242424] p-6 hover:border-[#D85A21] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[#D85A21]/10 border border-[#D85A21] flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#D85A21]" strokeWidth={2.5} />
                        </div>
                        <h3 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">{item.name}</h3>
                      </div>
                      <p className="text-[#999] text-sm mb-4 leading-relaxed">{item.description}</p>
                      <h4 className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00] mb-3">
                        ESSENTIALS CHECKLIST
                      </h4>
                      <ul className="space-y-2">
                        {item.essentials?.map((e: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#CCC]">
                            <Check className="w-3.5 h-3.5 text-[#D85A21] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Advisory ── */}
            {activeTab === "advisory" && (
              <div className="space-y-6">
                {advisories.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-2 border-[#E5FF00]/30 bg-[#242424] p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-[#E5FF00]" strokeWidth={2.5} />
                      <h3 className="font-['Oswald'] text-xl font-bold text-[#E5FF00]">{item.name}</h3>
                    </div>
                    <p className="text-[#CCC] text-base mb-6 leading-relaxed">{item.description}</p>
                    <div className="bg-[#1A1A1A] border-2 border-[#333] p-5">
                      <h4 className="font-['Oswald'] text-sm tracking-widest text-[#D85A21] mb-4">
                        CRITICAL TIPS
                      </h4>
                      <ul className="space-y-3">
                        {item.tips?.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-[#CCC]">
                            <span className="w-6 h-6 bg-[#D85A21] flex items-center justify-center text-xs font-['Oswald'] font-bold text-[#1A1A1A] flex-shrink-0">
                              {i + 1}
                            </span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Comparison modal */}
      <AnimatePresence>
        {showCompare && compareBikes.length === 2 && (
          <CompareModal
            bikes={compareBikes as [any, any]}
            onClose={() => {
              setShowCompare(false);
              setCompareList([]);
              setCompareMode(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
