import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Clock,
  Mountain,
  MapPin,
  ChevronRight,
  Filter,
  Users,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api } from "../lib/api";
import { useStore } from "../store";

const DIFFICULTIES = ["ALL", "MODERATE", "HARD", "EXTREME"];
const DURATIONS = ["ALL", "SHORT", "MEDIUM", "LONG"];
const TERRAINS = ["ALL", "HIGH-ALTITUDE", "MOUNTAIN", "DESERT", "JUNGLE", "ICE"];

const SORT_OPTIONS = [
  { value: "default", label: "DEFAULT" },
  { value: "price-asc", label: "PRICE: LOW → HIGH" },
  { value: "price-desc", label: "PRICE: HIGH → LOW" },
  { value: "duration-asc", label: "DURATION: SHORT FIRST" },
  { value: "duration-desc", label: "DURATION: LONG FIRST" },
  { value: "altitude", label: "MAX ALTITUDE" },
];

export function ExpeditionsPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const {
    difficultyFilter, setDifficultyFilter,
    durationFilter, setDurationFilter,
    terrainFilter, setTerrainFilter,
  } = useStore();

  useEffect(() => {
    async function load() {
      try {
        await api.seed();
        const data = await api.getTours();
        setTours(data.tours || []);
      } catch (err) {
        console.error("Error loading tours:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = tours
    .filter((tour) => {
      if (difficultyFilter !== "ALL" && tour.difficulty !== difficultyFilter) return false;
      if (terrainFilter !== "ALL" && tour.terrain !== terrainFilter) return false;
      if (durationFilter !== "ALL") {
        if (durationFilter === "SHORT" && tour.duration > 8) return false;
        if (durationFilter === "MEDIUM" && (tour.duration < 9 || tour.duration > 12)) return false;
        if (durationFilter === "LONG" && tour.duration < 13) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          tour.title?.toLowerCase().includes(q) ||
          tour.subtitle?.toLowerCase().includes(q) ||
          tour.terrain?.toLowerCase().includes(q) ||
          tour.difficulty?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return (a.price || 0) - (b.price || 0);
        case "price-desc": return (b.price || 0) - (a.price || 0);
        case "duration-asc": return (a.duration || 0) - (b.duration || 0);
        case "duration-desc": return (b.duration || 0) - (a.duration || 0);
        case "altitude": return (b.elevation?.max || 0) - (a.elevation?.max || 0);
        default: return 0;
      }
    });

  const hasActiveFilters =
    difficultyFilter !== "ALL" || durationFilter !== "ALL" || terrainFilter !== "ALL" || searchQuery.trim();

  const resetAll = () => {
    setDifficultyFilter("ALL");
    setDurationFilter("ALL");
    setTerrainFilter("ALL");
    setSearchQuery("");
    setSortBy("default");
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case "EXTREME": return "bg-red-600";
      case "HARD": return "bg-[#D85A21]";
      case "MODERATE": return "bg-yellow-600";
      default: return "bg-[#666]";
    }
  };

  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="bg-[#111] border-b-2 border-[#333] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="font-['Oswald'] text-xs tracking-widest text-[#D85A21]">
            CHOOSE YOUR CHALLENGE
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Oswald'] font-bold mt-2">
            ALL <span className="text-[#D85A21]">EXPEDITIONS</span>
          </h1>
          <p className="text-[#999] text-lg mt-4 max-w-xl">
            Fixed departure dates. Expert-led groups. Every ride backed by the Shadow Fleet Guarantee.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + Sort + Filter row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" strokeWidth={2.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expeditions..."
              className="w-full bg-[#242424] border-2 border-[#333] pl-10 pr-10 py-3 text-[#F4F4F5] text-sm font-['Inter'] focus:border-[#D85A21] focus:outline-none transition-colors placeholder:text-[#444]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#F4F4F5] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" strokeWidth={2.5} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#242424] border-2 border-[#333] pl-10 pr-4 py-3 text-[#F4F4F5] text-sm font-['Oswald'] tracking-wider focus:border-[#D85A21] focus:outline-none transition-colors appearance-none cursor-pointer hover:border-[#D85A21] min-w-[200px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 border-2 font-['Oswald'] tracking-wider text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? "border-[#D85A21] text-[#D85A21]"
                : "border-[#333] text-[#999] hover:border-[#D85A21] hover:text-[#D85A21]"
            }`}
          >
            <Filter className="w-4 h-4" strokeWidth={2.5} />
            FILTERS {hasActiveFilters ? "●" : showFilters ? "▲" : "▼"}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-2 border-[#333] bg-[#242424] p-6 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Difficulty */}
              <div>
                <label className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00] mb-3 block">
                  DIFFICULTY
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(d)}
                      className={`px-3 py-2 text-xs font-['Oswald'] tracking-wider border-2 transition-colors ${
                        difficultyFilter === d
                          ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                          : "border-[#333] text-[#999] hover:border-[#D85A21]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00] mb-3 block">
                  DURATION
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDurationFilter(d)}
                      className={`px-3 py-2 text-xs font-['Oswald'] tracking-wider border-2 transition-colors ${
                        durationFilter === d
                          ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                          : "border-[#333] text-[#999] hover:border-[#D85A21]"
                      }`}
                    >
                      {d === "SHORT" ? "≤8 DAYS" : d === "MEDIUM" ? "9-12 DAYS" : d === "LONG" ? "13+ DAYS" : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terrain */}
              <div>
                <label className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00] mb-3 block">
                  TERRAIN
                </label>
                <div className="flex flex-wrap gap-2">
                  {TERRAINS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTerrainFilter(t)}
                      className={`px-3 py-2 text-xs font-['Oswald'] tracking-wider border-2 transition-colors ${
                        terrainFilter === t
                          ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                          : "border-[#333] text-[#999] hover:border-[#D85A21]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count + reset */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#999] text-sm">
            Showing <span className="text-[#E5FF00] font-bold">{filtered.length}</span> of{" "}
            <span className="text-[#999]">{tours.length}</span> expedition{tours.length !== 1 ? "s" : ""}
            {sortBy !== "default" && (
              <span className="ml-2 text-[#555]">
                · sorted by {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              </span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-xs text-[#555] hover:text-[#D85A21] font-['Oswald'] tracking-wider transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
              CLEAR ALL
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[420px] bg-[#242424] animate-pulse border-2 border-[#333]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-[#333] mx-auto mb-4" strokeWidth={2.5} />
            <h3 className="font-['Oswald'] text-xl text-[#999]">NO EXPEDITIONS MATCH</h3>
            <p className="text-[#555] text-sm mt-2 mb-6">Try clearing filters or broadening your search</p>
            <button
              onClick={resetAll}
              className="px-6 py-3 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] tracking-wider hover:shadow-[4px_4px_0px_#E5FF00] transition-all"
            >
              RESET ALL FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tour, idx) => (
              <motion.div
                key={tour.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link to={`/expeditions/${tour.slug}`} className="block group h-full">
                  <div className="border-2 border-[#333] group-hover:border-[#D85A21] transition-colors bg-[#242424] h-full flex flex-col">
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={tour.image}
                        alt={tour.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#242424] to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`${difficultyColor(tour.difficulty)} px-2 py-1 text-xs font-['Oswald'] font-bold tracking-wider text-[#F4F4F5]`}>
                          {tour.difficulty}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-[#1A1A1A]/80 px-2 py-1 text-xs font-['Oswald'] tracking-wider text-[#E5FF00]">
                          {tour.terrain}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-['Oswald'] font-bold text-[#F4F4F5] group-hover:text-[#D85A21] transition-colors">
                        {tour.title}
                      </h3>
                      <p className="text-[#999] text-sm mt-1 mb-4">{tour.subtitle}</p>

                      <div className="flex items-center gap-4 text-xs text-[#999] mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {tour.duration} DAYS
                        </span>
                        <span className="flex items-center gap-1">
                          <Mountain className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {tour.elevation?.max?.toLocaleString()}m MAX
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                          MAX {tour.maxGroupSize}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#333]">
                        <div>
                          <span className="text-[#666] text-xs">FROM</span>
                          <span className="text-[#E5FF00] font-['Oswald'] text-xl font-bold ml-2">
                            ₹{tour.price?.toLocaleString()}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[#D85A21] font-['Oswald'] text-sm font-bold group-hover:text-[#E5FF00] transition-colors">
                          VIEW
                          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
