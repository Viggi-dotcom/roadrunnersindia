import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Mountain,
  Users,
  Calendar,
  MapPin,
  Check,
  Phone,
  ChevronDown,
  ChevronUp,
  Shield,
  Gauge,
  Share2,
  Copy,
  Timer,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api, generateWhatsAppLink } from "../lib/api";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Departure countdown helper ────────────────────────────────────────────────
function DepartureCountdown({ dateStr }: { dateStr: string }) {
  const dep = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((dep.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return null;
  if (days === 0)
    return (
      <span className="inline-flex items-center gap-1 text-[#E5FF00] font-['Oswald'] text-xs tracking-wider">
        <Timer className="w-3 h-3" strokeWidth={2.5} />
        DEPARTING TODAY
      </span>
    );
  if (days <= 14)
    return (
      <span className="inline-flex items-center gap-1 text-red-400 font-['Oswald'] text-xs tracking-wider">
        <Timer className="w-3 h-3" strokeWidth={2.5} />
        {days} DAYS AWAY — BOOK NOW
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[#666] font-['Oswald'] text-xs tracking-wider">
      <Timer className="w-3 h-3" strokeWidth={2.5} />
      {days} DAYS AWAY
    </span>
  );
}

export function TourDetailPage() {
  const { slug } = useParams();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!slug) return;
        const data = await api.getTour(slug);
        setTour(data.tour);
      } catch (err) {
        console.error("Error loading tour:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#D85A21] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-4">
        <h2 className="font-['Oswald'] text-2xl text-[#999]">EXPEDITION NOT FOUND</h2>
        <Link to="/expeditions" className="text-[#D85A21] font-['Oswald'] tracking-wider hover:text-[#E5FF00]">
          ← BACK TO EXPEDITIONS
        </Link>
      </div>
    );
  }

  const elevationData =
    tour.itinerary?.map((day: any) => ({
      name: `D${day.day}`,
      elevation: day.elevation,
      distance: day.distance,
    })) || [];

  const totalDistance =
    tour.itinerary?.reduce((sum: number, d: any) => sum + (d.distance || 0), 0) || 0;

  const difficultyColor = (d: string) => {
    switch (d) {
      case "EXTREME": return "text-red-500";
      case "HARD": return "text-[#D85A21]";
      case "MODERATE": return "text-yellow-500";
      default: return "text-[#666]";
    }
  };

  return (
    <div className="bg-[#1A1A1A] min-h-screen pb-24 lg:pb-0">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[400px]">
        <ImageWithFallback
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent" />

        {/* Share button top-right */}
        <button
          onClick={handleCopyLink}
          className="absolute top-20 right-4 sm:right-6 z-10 flex items-center gap-2 px-3 py-2 bg-[#1A1A1A]/80 border border-[#333] text-[#999] hover:border-[#D85A21] hover:text-[#D85A21] font-['Oswald'] text-xs tracking-wider transition-colors backdrop-blur-sm"
        >
          {copying ? (
            <Check className="w-3.5 h-3.5 text-[#E5FF00]" strokeWidth={2.5} />
          ) : (
            <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
          {copying ? "COPIED!" : "COPY LINK"}
        </button>

        <div className="absolute bottom-0 left-0 right-0 pb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Link
              to="/expeditions"
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#D85A21] font-['Oswald'] text-sm tracking-wider mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              ALL EXPEDITIONS
            </Link>

            <div className="flex flex-wrap gap-3 mb-3">
              <span
                className={`px-3 py-1 text-sm font-['Oswald'] font-bold tracking-wider text-[#F4F4F5] ${
                  tour.difficulty === "EXTREME"
                    ? "bg-red-600"
                    : tour.difficulty === "HARD"
                    ? "bg-[#D85A21]"
                    : "bg-yellow-600"
                }`}
              >
                {tour.difficulty}
              </span>
              <span className="bg-[#333] px-3 py-1 text-sm font-['Oswald'] tracking-wider text-[#F4F4F5]">
                {tour.terrain}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Oswald'] font-bold">
              {tour.title}
            </h1>
            <p className="text-[#D85A21] font-['Oswald'] text-lg mt-2">{tour.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Clock, label: "DURATION", value: `${tour.duration} DAYS` },
            { icon: Mountain, label: "MAX ELEVATION", value: `${tour.elevation?.max?.toLocaleString()}m` },
            { icon: Users, label: "GROUP SIZE", value: `MAX ${tour.maxGroupSize}` },
            { icon: Gauge, label: "TOTAL KM", value: `${totalDistance} KM` },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="p-4 border-2 border-[#333] bg-[#242424] text-center">
                <Icon className="w-5 h-5 text-[#D85A21] mx-auto mb-2" strokeWidth={2.5} />
                <span className="text-[#666] text-xs font-['Oswald'] tracking-wider block">{stat.label}</span>
                <span className="text-[#F4F4F5] font-['Oswald'] text-lg font-bold">{stat.value}</span>
              </div>
            );
          })}
        </div>

        {/* Description */}
        <div className="mb-10">
          <p className="text-[#CCC] text-base leading-relaxed">{tour.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Itinerary + Chart */}
          <div className="lg:col-span-2">
            {/* Elevation Chart */}
            {elevationData.length > 0 && (
              <div className="mb-8 border-2 border-[#333] bg-[#242424] p-4 sm:p-6">
                <h3 className="font-['Oswald'] text-lg font-bold text-[#E5FF00] mb-4">
                  ELEVATION PROFILE
                </h3>
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={elevationData}>
                      <defs>
                        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D85A21" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D85A21" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#666", fontSize: 10, fontFamily: "Oswald" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#666", fontSize: 10, fontFamily: "Oswald" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                        tickFormatter={(v) => `${v}m`}
                        width={48}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#242424",
                          border: "2px solid #333",
                          borderRadius: 0,
                          fontFamily: "Oswald",
                          color: "#F4F4F5",
                          fontSize: 12,
                        }}
                        formatter={(value: any, name: string) => [
                          name === "elevation" ? `${value}m` : `${value}km`,
                          name === "elevation" ? "Elevation" : "Distance",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="elevation"
                        stroke="#D85A21"
                        strokeWidth={2}
                        fill="url(#elevGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Day-by-Day Itinerary */}
            {tour.itinerary?.length > 0 && (
              <div className="mb-8">
                <h3 className="font-['Oswald'] text-xl font-bold text-[#F4F4F5] mb-4">
                  DAY-BY-DAY <span className="text-[#D85A21]">ITINERARY</span>
                </h3>
                <div className="space-y-2">
                  {tour.itinerary.map((day: any, idx: number) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-2 border-[#333] bg-[#242424]"
                    >
                      <button
                        onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#2A2A2A] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-10 h-10 bg-[#D85A21] flex items-center justify-center font-['Oswald'] text-sm font-bold text-[#1A1A1A] flex-shrink-0">
                            {day.day < 10 ? `0${day.day}` : day.day}
                          </span>
                          <div>
                            <h4 className="font-['Oswald'] text-sm font-bold text-[#F4F4F5]">
                              {day.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-[#666] mt-0.5">
                              {day.elevation > 0 && <span>{day.elevation.toLocaleString()}m</span>}
                              {day.distance > 0 && <span>{day.distance} km</span>}
                            </div>
                          </div>
                        </div>
                        {expandedDay === idx ? (
                          <ChevronUp className="w-5 h-5 text-[#D85A21] flex-shrink-0" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#666] flex-shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                      {expandedDay === idx && day.description && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="px-4 pb-4 ml-14"
                        >
                          <p className="text-[#999] text-sm leading-relaxed">{day.description}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar (desktop only visible as sidebar, mobile becomes top-content) */}
          <div className="space-y-6">
            {/* Price & CTA */}
            <div className="border-2 border-[#D85A21] bg-[#242424] p-6 lg:sticky lg:top-24">
              <div className="mb-4">
                <span className="text-[#666] text-xs font-['Oswald'] tracking-wider">STARTING FROM</span>
                <div className="text-[#E5FF00] font-['Oswald'] text-4xl font-bold">
                  ₹{tour.price?.toLocaleString()}
                </div>
                <span className="text-[#666] text-xs">per person, all inclusive</span>
              </div>

              {tour.nextDeparture && (
                <div className="mb-4 pb-4 border-b border-[#333] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#999] text-sm">
                    <Calendar className="w-4 h-4 text-[#D85A21]" strokeWidth={2.5} />
                    <span>
                      Next:{" "}
                      {new Date(tour.nextDeparture).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="ml-6">
                    <DepartureCountdown dateStr={tour.nextDeparture} />
                  </div>
                </div>
              )}

              <a
                href={generateWhatsAppLink(tour.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-lg font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none mb-3"
              >
                <Phone className="w-5 h-5" strokeWidth={2.5} />
                INQUIRE ON WHATSAPP
              </a>

              {/* Share */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#333] text-[#999] font-['Oswald'] text-sm tracking-wider hover:border-[#666] hover:text-[#F4F4F5] transition-colors"
              >
                {copying ? (
                  <Check className="w-4 h-4 text-[#E5FF00]" strokeWidth={2.5} />
                ) : (
                  <Share2 className="w-4 h-4" strokeWidth={2.5} />
                )}
                {copying ? "LINK COPIED!" : "SHARE THIS EXPEDITION"}
              </button>

              <p className="text-[#666] text-xs text-center mt-3">
                No forms. No checkout. Just a conversation.
              </p>
            </div>

            {/* Shadow Fleet Checklist */}
            {tour.shadowFleet?.length > 0 && (
              <div className="border-2 border-[#333] bg-[#242424] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#E5FF00]" strokeWidth={2.5} />
                  <h4 className="font-['Oswald'] text-base font-bold text-[#E5FF00]">
                    SHADOW FLEET INCLUDED
                  </h4>
                </div>
                <ul className="space-y-3">
                  {tour.shadowFleet.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-[#D85A21] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-[#CCC]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#111]/95 border-t-2 border-[#D85A21] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <span className="text-[#666] text-[10px] font-['Oswald'] tracking-wider block">FROM</span>
            <span className="text-[#E5FF00] font-['Oswald'] text-xl font-bold">
              ₹{tour.price?.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2 flex-1 justify-end">
            <button
              onClick={handleCopyLink}
              className="w-10 h-10 border-2 border-[#333] flex items-center justify-center text-[#666] hover:text-[#F4F4F5] transition-colors flex-shrink-0"
              title="Copy link"
            >
              {copying ? (
                <Check className="w-4 h-4 text-[#E5FF00]" strokeWidth={2.5} />
              ) : (
                <Share2 className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
            <a
              href={generateWhatsAppLink(tour.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all flex-shrink-0"
            >
              <Phone className="w-4 h-4" strokeWidth={2.5} />
              INQUIRE NOW
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
