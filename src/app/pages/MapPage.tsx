import { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  Fuel,
  Home,
  MapPin,
  Phone,
  X,
  Layers,
  Navigation,
  Crosshair,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { api } from "../lib/api";
import { useStore } from "../store";
import { toast } from "sonner";

// ── Colour palette ────────────────────────────────────────────────────────────
const POINT_COLORS: Record<string, string> = {
  mechanic: "#E5FF00",
  fuel: "#D85A21",
  stay: "#22C55E",
};

const FILTER_KEYS: Record<string, "showMechanics" | "showFuel" | "showStays"> = {
  mechanic: "showMechanics",
  fuel: "showFuel",
  stay: "showStays",
};

const ICON_PATHS: Record<string, string> = {
  mechanic:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  fuel: '<path d="M3 22V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9"/><path d="M17 11h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-1.5"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="7" y1="6" x2="13" y2="6"/>',
  stay: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" fill="none"/>',
  default:
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};

function buildIcon(type: string, selected: boolean): L.DivIcon {
  const color = POINT_COLORS[type] ?? "#999";
  const bg = selected ? color : `${color}2a`;
  const stroke = selected ? "#1A1A1A" : color;
  const size = selected ? 46 : 38;
  const border = selected ? 3 : 2;
  const svgPath = ICON_PATHS[type] ?? ICON_PATHS.default;

  const html = `
    <div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      background:${bg};
      border:${border}px solid ${color};
      box-sizing:border-box;
      cursor:pointer;
      transition:transform 0.15s;
      box-shadow:${selected ? `3px 3px 0 ${color}` : "none"};
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="${stroke}" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>`;

  return L.divIcon({ className: "", html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

/** User location pulsing marker */
function buildUserIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;
        background:#3B82F6;border:2px solid #F4F4F5;
        border-radius:50%;
        box-shadow:0 0 0 6px rgba(59,130,246,0.25);
      "></div>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [24, 24], iconAnchor: [12, 12] });
}

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Inner component — lives inside MapContainer so it can call useMap() */
function MapController({ flyTo }: { flyTo: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 11, { animate: true, duration: 1.5 });
  }, [flyTo, map]);
  return null;
}

// ── Major Indian riding hubs for manual fallback ──────────────────────────────
const CITY_PRESETS: { label: string; coords: [number, number] }[] = [
  { label: "Delhi", coords: [28.6139, 77.209] },
  { label: "Chandigarh", coords: [30.7333, 76.7794] },
  { label: "Manali", coords: [32.2432, 77.1892] },
  { label: "Leh", coords: [34.1526, 77.5771] },
  { label: "Srinagar", coords: [34.0837, 74.7973] },
  { label: "Shimla", coords: [31.1048, 77.1734] },
  { label: "Dehradun", coords: [30.3165, 78.0322] },
  { label: "Rishikesh", coords: [30.0869, 78.2676] },
  { label: "Jammu", coords: [32.7266, 74.857] },
  { label: "Spiti Valley", coords: [32.2458, 78.034] },
  { label: "Mumbai", coords: [19.076, 72.8777] },
  { label: "Pune", coords: [18.5204, 73.8567] },
  { label: "Bangalore", coords: [12.9716, 77.5946] },
  { label: "Kolkata", coords: [22.5726, 88.3639] },
  { label: "Guwahati", coords: [26.1445, 91.7362] },
  { label: "Tawang", coords: [27.5859, 91.8674] },
];

// ── Main page component ───────────────────────────────────────────────────────
export function MapPage() {
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { mapFilters, toggleMapFilter, selectedMapPoint, setSelectedMapPoint } = useStore();
  const [showLegend, setShowLegend] = useState(true);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [nearestPoints, setNearestPoints] = useState<any[]>([]);
  const [showNearest, setShowNearest] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        await api.seed();
        const data = await api.getMapPoints();
        setPoints(data.points || []);
      } catch (err) {
        console.error("Error loading map points:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredPoints = useMemo(
    () =>
      points.filter((p) => {
        const key = FILTER_KEYS[p.type];
        return key ? mapFilters[key] : true;
      }),
    [points, mapFilters]
  );

  const applyLocation = (coords: [number, number], label: string) => {
    setUserLocation(coords);
    setFlyTarget(coords);
    setShowCityPicker(false);

    const withDist = points
      .map((p) => ({ ...p, distanceKm: haversineKm(coords[0], coords[1], p.lat, p.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);

    setNearestPoints(withDist);
    setShowNearest(true);
    toast.success(`Showing nearest pit-stops to ${label}`);
  };

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setShowCityPicker(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc: [number, number] = [latitude, longitude];
        setUserLocation(loc);
        setFlyTarget(loc);

        const withDist = points
          .map((p) => ({ ...p, distanceKm: haversineKm(latitude, longitude, p.lat, p.lng) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 3);

        setNearestPoints(withDist);
        setShowNearest(true);
        setLocating(false);
        toast.success("Location found — showing 3 nearest pit-stops");
      },
      (err) => {
        console.error("Geolocation error:", `code=${err.code} message=${err.message}`);
        setLocating(false);
        // Any denial (permission or policy) → offer the city picker instead
        setShowCityPicker(true);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, [points]);

  return (
    <div className="h-[calc(100vh-64px)] bg-[#111] relative overflow-hidden">
      {/* ── Leaflet map ── */}
      <MapContainer
        center={[22.5, 82.5]}
        zoom={5}
        style={{ width: "100%", height: "100%", background: "#111" }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#666">OSM</a> &copy; <a href="https://carto.com/attributions" style="color:#666">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="topright" />
        <MapController flyTo={flyTarget} />

        {/* Pit-stop markers */}
        {filteredPoints.map((point) => {
          const isSelected = selectedMapPoint?.id === point.id;
          return (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={buildIcon(point.type, isSelected)}
              eventHandlers={{
                click: () => setSelectedMapPoint(isSelected ? null : point),
              }}
            />
          );
        })}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={buildUserIcon()}
            eventHandlers={{ click: () => {} }}
          />
        )}
      </MapContainer>

      {/* ── Selected-point info card ── */}
      <AnimatePresence>
        {selectedMapPoint && (
          <motion.div
            key="info-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[320px] max-w-[90vw] bg-[#242424] border-2 border-[#333] shadow-[4px_4px_0px_#D85A21]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2"
                  style={{ backgroundColor: POINT_COLORS[selectedMapPoint.type] ?? "#999" }}
                />
                <span className="font-['Oswald'] text-xs tracking-widest text-[#999] uppercase">
                  {selectedMapPoint.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedMapPoint(null)}
                className="text-[#666] hover:text-[#F4F4F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-['Oswald'] text-base font-bold text-[#F4F4F5] mb-1 uppercase tracking-wide">
                {selectedMapPoint.name}
              </h3>
              <p className="text-[#999] text-xs mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {selectedMapPoint.city}
              </p>
              {selectedMapPoint.description && (
                <p className="text-[#CCC] text-xs mb-4 leading-relaxed">
                  {selectedMapPoint.description}
                </p>
              )}
              {selectedMapPoint.phone && (
                <a
                  href={`tel:${selectedMapPoint.phone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-[#D85A21] text-[#1A1A1A] font-['Oswald'] text-xs font-bold tracking-wider hover:bg-[#E5FF00] transition-colors w-full justify-center"
                >
                  <Phone className="w-3 h-3" />
                  CALL {selectedMapPoint.phone}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer-filter legend ── */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="w-10 h-10 bg-[#242424]/90 border-2 border-[#333] flex items-center justify-center text-[#F4F4F5] hover:border-[#D85A21] transition-colors mb-2 backdrop-blur-sm"
          title="Toggle layers"
        >
          <Layers className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <AnimatePresence>
          {showLegend && (
            <motion.div
              key="legend"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#242424]/90 border-2 border-[#333] p-4 min-w-[210px] backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-3 h-3 text-[#E5FF00]" strokeWidth={2.5} />
                <h4 className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00]">
                  PIT-STOP LAYERS
                </h4>
              </div>

              <div className="space-y-3">
                {(
                  [
                    { key: "showMechanics", label: "MECHANICS", icon: Wrench, color: "#E5FF00" },
                    { key: "showFuel", label: "FUEL STATIONS", icon: Fuel, color: "#D85A21" },
                    { key: "showStays", label: "BIKER STAYS", icon: Home, color: "#22C55E" },
                  ] as const
                ).map((filter) => {
                  const Icon = filter.icon;
                  const typeMap: Record<string, string> = {
                    showMechanics: "mechanic",
                    showFuel: "fuel",
                    showStays: "stay",
                  };
                  const count = points.filter((p) => p.type === typeMap[filter.key]).length;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => toggleMapFilter(filter.key)}
                      className={`flex items-center gap-3 w-full text-left py-1 transition-opacity ${
                        mapFilters[filter.key] ? "opacity-100" : "opacity-35"
                      }`}
                    >
                      <div
                        className="w-6 h-6 flex items-center justify-center border-2 shrink-0"
                        style={{
                          borderColor: filter.color,
                          backgroundColor: mapFilters[filter.key]
                            ? `${filter.color}22`
                            : "transparent",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: filter.color }} strokeWidth={2.5} />
                      </div>
                      <span className="font-['Oswald'] text-xs tracking-wider text-[#F4F4F5] flex-1">
                        {filter.label}
                      </span>
                      <span className="text-xs text-[#666] font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-[#333] text-[10px] text-[#555] font-['Oswald'] tracking-wider">
                © OSM CONTRIBUTORS · CARTO
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Locate Me button ── */}
      <div className="absolute top-4 right-14 z-[1000]">
        <button
          onClick={handleLocate}
          disabled={locating}
          className={`flex items-center gap-2 px-3 py-2.5 border-2 font-['Oswald'] text-xs tracking-wider transition-all backdrop-blur-sm disabled:opacity-60 ${
            userLocation
              ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]"
              : "bg-[#242424]/90 border-[#333] text-[#F4F4F5] hover:border-[#D85A21] hover:text-[#D85A21]"
          }`}
          title="Find nearest pit-stops"
        >
          {locating ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
          {locating ? "LOCATING..." : userLocation ? "LOCATED" : "FIND NEAREST"}
        </button>
      </div>

      {/* ── City picker fallback ── */}
      <AnimatePresence>
        {showCityPicker && (
          <motion.div
            key="city-picker"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-4 z-[1001] w-[260px] bg-[#1A1A1A] border-2 border-[#D85A21] shadow-[4px_4px_0px_#D85A21]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#111]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D85A21]" strokeWidth={2.5} />
                <span className="font-['Oswald'] text-xs tracking-widest text-[#D85A21]">
                  SELECT YOUR CITY
                </span>
              </div>
              <button
                onClick={() => setShowCityPicker(false)}
                className="text-[#666] hover:text-[#F4F4F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="px-4 pt-3 pb-1 text-[10px] text-[#555] font-['Oswald'] tracking-wider">
              GPS UNAVAILABLE — PICK A NEARBY CITY
            </p>
            <div className="max-h-64 overflow-y-auto divide-y divide-[#242424]">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.label}
                  onClick={() => applyLocation(city.coords, city.label)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#242424] transition-colors"
                >
                  <span className="font-['Oswald'] text-xs text-[#F4F4F5] tracking-wide">
                    {city.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555]" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nearest pit-stops panel ── */}
      <AnimatePresence>
        {showNearest && nearestPoints.length > 0 && (
          <motion.div
            key="nearest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute top-16 right-4 z-[1000] w-[260px] bg-[#242424]/95 border-2 border-[#3B82F6] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-[#3B82F6]" strokeWidth={2.5} />
                <span className="font-['Oswald'] text-xs tracking-widest text-[#3B82F6]">
                  NEAREST PIT-STOPS
                </span>
              </div>
              <button
                onClick={() => setShowNearest(false)}
                className="text-[#666] hover:text-[#F4F4F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-[#333]">
              {nearestPoints.map((point, idx) => (
                <button
                  key={point.id}
                  onClick={() => {
                    setSelectedMapPoint(point);
                    setFlyTarget([point.lat, point.lng]);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2A2A2A] transition-colors"
                >
                  <span
                    className="w-2 h-2 flex-shrink-0"
                    style={{ backgroundColor: POINT_COLORS[point.type] ?? "#999" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-['Oswald'] text-xs text-[#F4F4F5] truncate">{point.name}</p>
                    <p className="text-[#666] text-[10px]">
                      {point.city} · {point.distanceKm.toFixed(1)} km away
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555] flex-shrink-0" strokeWidth={2.5} />
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-[#1A1A1A]/50 text-[10px] text-[#555] font-['Oswald'] tracking-wider">
              TAP A POINT TO VIEW ON MAP
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading spinner ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0D0D0D]/85 z-[1001] pointer-events-none"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#333] border-t-[#D85A21] rounded-full animate-spin mx-auto mb-4" />
              <p className="font-['Oswald'] text-sm tracking-widest text-[#999]">
                LOADING PIT-STOPS...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}