import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Menu, X, Mountain, MapPin, Bike, Shield, Phone } from "lucide-react";
import { useStore } from "../store";
import { generateWhatsAppLink } from "../lib/api";
import { motion } from "motion/react";

const NAV_LINKS = [
  { to: "/", label: "HOME", icon: Mountain },
  { to: "/expeditions", label: "EXPEDITIONS", icon: MapPin },
  { to: "/fleet", label: "FLEET & GEAR", icon: Bike },
  { to: "/map", label: "PIT-STOP MAP", icon: MapPin },
  { to: "/dashboard", label: "DASHBOARD", icon: Shield },
];

export function Layout() {
  const location = useLocation();
  const { mobileMenuOpen, setMobileMenuOpen } = useStore();
  const isMapPage = location.pathname === "/map";

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F4F4F5] flex flex-col">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-sm border-b-2 border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-10 h-10 bg-[#D85A21] flex items-center justify-center border-2 border-[#D85A21] group-hover:bg-[#E5FF00] group-hover:border-[#E5FF00] transition-colors">
                <Mountain className="w-6 h-6 text-[#1A1A1A]" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="font-['Oswald'] text-lg font-bold tracking-tight text-[#F4F4F5]">
                  ROADRUNNERS
                </span>
                <span className="font-['Oswald'] text-lg font-bold tracking-tight text-[#D85A21]">
                  INDIA
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 font-['Oswald'] text-sm tracking-wider transition-colors ${
                      isActive
                        ? "text-[#E5FF00] border-b-2 border-[#E5FF00]"
                        : "text-[#999] hover:text-[#F4F4F5]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 px-4 py-2 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:bg-[#D85A21] hover:text-[#F4F4F5] transition-colors border-2 border-[#E5FF00] hover:border-[#D85A21]"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" strokeWidth={2.5} />
                  CONTACT
                </span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-12 h-12 flex items-center justify-center text-[#F4F4F5] hover:text-[#E5FF00] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={2.5} /> : <Menu className="w-6 h-6" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#1A1A1A] border-b-2 border-[#333]"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 font-['Oswald'] text-base tracking-wider transition-colors ${
                      isActive
                        ? "text-[#E5FF00] bg-[#242424] border-l-4 border-[#E5FF00]"
                        : "text-[#999] hover:text-[#F4F4F5] hover:bg-[#242424]"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-base font-bold tracking-wider mt-2"
              >
                <Phone className="w-5 h-5" strokeWidth={2.5} />
                CONTACT US
              </a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className={`flex-1 ${isMapPage ? "pt-16" : "pt-16"}`}>
        <Outlet />
      </main>

      {/* FOOTER */}
      {!isMapPage && (
        <footer className="bg-[#111] border-t-2 border-[#333]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-[#D85A21] flex items-center justify-center">
                    <Mountain className="w-6 h-6 text-[#1A1A1A]" strokeWidth={2.5} />
                  </div>
                  <span className="font-['Oswald'] text-xl font-bold">
                    ROADRUNNERS<span className="text-[#D85A21]">INDIA</span>
                  </span>
                </div>
                <p className="text-[#999] text-sm leading-relaxed">
                  India's premier adventure motorcycle expedition company. We don't just plan rides — we engineer experiences at the edge of the possible.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-['Oswald'] text-[#E5FF00] mb-4 text-base">QUICK LINKS</h4>
                <div className="space-y-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block text-[#999] text-sm hover:text-[#D85A21] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-['Oswald'] text-[#E5FF00] mb-4 text-base">RIDE WITH US</h4>
                <p className="text-[#999] text-sm mb-3">
                  Questions? Hit us up on WhatsApp. We respond faster than a 450 on an open highway.
                </p>
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[4px_4px_0px_#E5FF00] transition-all"
                >
                  <Phone className="w-4 h-4" strokeWidth={2.5} />
                  WHATSAPP US
                </a>
              </div>
            </div>

            <div className="border-t border-[#333] mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[#666] text-xs">
                &copy; 2026 RoadRunnersIndia. All rights reserved. Ride hard, ride safe.
              </p>
              <p className="text-[#666] text-xs">
                <span className="text-[#D85A21]">SHADOW FLEET GUARANTEE</span> on every expedition.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}