import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight,
  MapPin,
  Clock,
  Mountain,
  Shield,
  Wrench,
  Phone,
  Truck,
  Radio,
  HeartPulse,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { api, generateWhatsAppLink } from "../lib/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1764205821282-f28dd0e36c3c?w=1400&q=80";

const SHADOW_FLEET_ITEMS = [
  { icon: Truck, title: "CHASE VEHICLE", desc: "Fully loaded SUV with spares follows every group" },
  { icon: Wrench, title: "BACKUP BIKE", desc: "Identical motorcycle ready to swap in minutes" },
  { icon: Radio, title: "SAT PHONE", desc: "Satellite communication where networks don't exist" },
  { icon: HeartPulse, title: "TRAUMA KIT", desc: "First-responder medical kit on every vehicle" },
  { icon: Shield, title: "EVAC PLAN", desc: "Pre-coordinated emergency extraction routes" },
  { icon: Mountain, title: "OXYGEN", desc: "Portable concentrators for altitude emergencies" },
];

export function HomePage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -350, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 350, behavior: "smooth" });
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
    <div className="bg-[#1A1A1A]">
      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={HERO_IMAGE}
            alt="Motorcycle expedition through Himalayan mountains"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-[#1A1A1A]/30" />
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D85A21]/20 border border-[#D85A21] mb-6">
                <Shield className="w-4 h-4 text-[#E5FF00]" strokeWidth={2.5} />
                <span className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00]">
                  SHADOW FLEET GUARANTEE ON EVERY RIDE
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-['Oswald'] font-bold leading-[0.95] mb-6">
                <span className="text-[#F4F4F5]">RIDE THE</span>
                <br />
                <span className="text-[#D85A21]">IMPOSSIBLE</span>
                <br />
                <span className="text-[#F4F4F5]">ROADS</span>
              </h1>

              <p className="text-[#999] text-lg sm:text-xl leading-relaxed mb-8 max-w-lg font-['Inter']">
                India's most extreme motorcycle expeditions. Fixed departures. Expert-led. Backed by a shadow fleet that follows every group, every kilometer.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/expeditions"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-lg font-bold tracking-wider hover:shadow-[6px_6px_0px_#D85A21] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                >
                  VIEW EXPEDITIONS
                  <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-[#F4F4F5] font-['Oswald'] text-lg font-bold tracking-wider border-2 border-[#333] hover:border-[#D85A21] hover:text-[#D85A21] transition-colors"
                >
                  <MapPin className="w-5 h-5" strokeWidth={2.5} />
                  PIT-STOP MAP
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          
        </motion.div>
      </section>

      {/* TOP EXPEDITIONS - Horizontal Scroll */}
      <section className="py-16 sm:py-24 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-['Oswald'] text-xs tracking-widest text-[#D85A21]">
                FIXED DEPARTURES 2026-27
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Oswald'] font-bold mt-2">
                TOP <span className="text-[#D85A21]">EXPEDITIONS</span>
              </h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button
                onClick={scrollLeft}
                className="w-12 h-12 border-2 border-[#333] text-[#999] hover:border-[#D85A21] hover:text-[#D85A21] flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={scrollRight}
                className="w-12 h-12 border-2 border-[#333] text-[#999] hover:border-[#D85A21] hover:text-[#D85A21] flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[24px] pt-[0px] pb-[24px] mx-[10px] my-[0px]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[320px] sm:w-[380px] h-[460px] bg-[#242424] animate-pulse border-2 border-[#333]" />
            ))
          ) : (
            tours.map((tour, idx) => (
              <motion.div
                key={tour.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex-shrink-0 w-[320px] sm:w-[380px] snap-start"
              >
                <Link to={`/expeditions/${tour.slug}`} className="block group">
                  <div className="relative overflow-hidden border-2 border-[#333] group-hover:border-[#D85A21] transition-colors bg-[#242424]">
                    <div className="relative h-52 overflow-hidden">
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
                        <span className="bg-[#333] px-2 py-1 text-xs font-['Oswald'] tracking-wider text-[#F4F4F5]">
                          {tour.terrain}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-['Oswald'] font-bold text-[#F4F4F5] mb-1 group-hover:text-[#D85A21] transition-colors">
                        {tour.title}
                      </h3>
                      <p className="text-[#999] text-sm mb-4">{tour.subtitle}</p>

                      <div className="flex items-center gap-4 text-xs text-[#999] mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {tour.duration} DAYS
                        </span>
                        <span className="flex items-center gap-1">
                          <Mountain className="w-3.5 h-3.5" strokeWidth={2.5} />
                          {tour.elevation?.max?.toLocaleString()}m
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#666] text-xs">FROM</span>
                          <span className="text-[#E5FF00] font-['Oswald'] text-xl font-bold ml-2">
                            ₹{tour.price?.toLocaleString()}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[#D85A21] font-['Oswald'] text-sm font-bold group-hover:text-[#E5FF00] transition-colors">
                          DETAILS
                          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* SHADOW FLEET GUARANTEE */}
      <section className="py-16 sm:py-24 bg-[#111] border-y-2 border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00]">
              WHAT SEPARATES US
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Oswald'] font-bold mt-2">
              THE <span className="text-[#D85A21]">SHADOW FLEET</span> GUARANTEE
            </h2>
            <p className="text-[#999] text-lg mt-4 max-w-2xl mx-auto">
              Every expedition rolls with a dedicated support vehicle carrying backup bikes, tools, medical supplies, and satellite communication. Your safety isn't optional — it's engineered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SHADOW_FLEET_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-[#1A1A1A] border-2 border-[#333] hover:border-[#D85A21] transition-colors group"
                >
                  <div className="w-12 h-12 bg-[#D85A21]/10 border border-[#D85A21] flex items-center justify-center mb-4 group-hover:bg-[#D85A21] transition-colors">
                    <Icon className="w-6 h-6 text-[#D85A21] group-hover:text-[#1A1A1A] transition-colors" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-['Oswald'] text-base font-bold text-[#F4F4F5] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-[#999] text-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Oswald'] font-bold mb-6">
            READY TO <span className="text-[#D85A21]">RIDE</span>?
          </h2>
          <p className="text-[#999] text-lg mb-8 max-w-xl mx-auto">
            No complicated forms. No credit card checkout. Just hit us up on WhatsApp and we'll get you on the road.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={generateWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-lg font-bold tracking-wider hover:shadow-[6px_6px_0px_#D85A21] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              <Phone className="w-5 h-5" strokeWidth={2.5} />
              INQUIRE ON WHATSAPP
            </a>
            <Link
              to="/fleet"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#333] text-[#F4F4F5] font-['Oswald'] text-lg font-bold tracking-wider hover:border-[#D85A21] transition-colors"
            >
              FLEET & GEAR ADVISORY
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
