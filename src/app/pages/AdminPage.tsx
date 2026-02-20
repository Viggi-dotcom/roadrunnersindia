import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  MapPin,
  Bike,
  FileText,
  Trash2,
  Plus,
  LogOut,
  X,
  RefreshCw,
  Route,
  Pencil,
  ExternalLink,
  Eye,
} from "lucide-react";
import { api } from "../lib/api";
import { useStore } from "../store";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { TourForm } from "../components/admin/TourForm";

type AdminTab = "tours" | "fleet" | "map" | "permits";

// ── Map Point Form Modal ──────────────────────────────────────────────────────
function MapPointForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { accessToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "mechanic",
    city: "",
    lat: "",
    lng: "",
    phone: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.lat || !form.lng) {
      toast.error("Name, city, latitude and longitude are required");
      return;
    }
    setLoading(true);
    try {
      const id = `${form.type}-${Date.now()}`;
      await api.saveMapPoint(
        {
          id,
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
        },
        accessToken!
      );
      toast.success("Map point added");
      onSave();
    } catch (err) {
      console.error("Error saving map point:", err);
      toast.error("Failed to add map point");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="block text-xs font-['Oswald'] text-[#999] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1A1A1A] border-2 border-[#333] w-full max-w-lg">
        <div className="bg-[#111] border-b border-[#333] p-4 flex items-center justify-between">
          <h2 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">
            ADD MAP POINT
          </h2>
          <button onClick={onClose} className="text-[#666] hover:text-[#F4F4F5]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("NAME", "name", "text", "e.g. Rinchen Motor Works")}
            <div>
              <label className="block text-xs font-['Oswald'] text-[#999] mb-1">
                TYPE
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
              >
                <option value="mechanic">MECHANIC</option>
                <option value="fuel">FUEL STATION</option>
                <option value="stay">BIKER STAY</option>
              </select>
            </div>
            {field("CITY", "city", "text", "e.g. Leh")}
            {field("PHONE (optional)", "phone", "text", "+91-XXXXXXXXXX")}
            {field("LATITUDE", "lat", "text", "e.g. 34.1526")}
            {field("LONGITUDE", "lng", "text", "e.g. 77.5771")}
            <div className="col-span-2">
              <label className="block text-xs font-['Oswald'] text-[#999] mb-1">
                DESCRIPTION (optional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                placeholder="Short description for riders..."
                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#333] text-[#999] hover:text-[#F4F4F5] font-['Oswald'] text-sm tracking-wider transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-sm tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all disabled:opacity-50"
            >
              {loading ? "SAVING..." : "ADD POINT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Fleet Item Form Modal ─────────────────────────────────────────────────────
function FleetItemForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { accessToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "bike",
    description: "",
    image: "",
    terrainRaw: "", // comma-separated for bikes
    prosRaw: "",    // newline-separated for bikes
    consRaw: "",    // newline-separated for bikes
    essentialsRaw: "", // newline-separated for gear
    tipsRaw: "",       // newline-separated for advisory
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      toast.error("Name and description are required");
      return;
    }
    setLoading(true);
    try {
      const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const base: any = { id, name: form.name, category: form.category, description: form.description };
      if (form.category === "bike") {
        base.image = form.image;
        base.terrain = form.terrainRaw.split(",").map((s) => s.trim()).filter(Boolean);
        base.pros = form.prosRaw.split("\n").map((s) => s.trim()).filter(Boolean);
        base.cons = form.consRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      } else if (form.category === "gear") {
        base.essentials = form.essentialsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      } else {
        base.tips = form.tipsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      }
      await api.saveFleetItem(base, accessToken!);
      toast.success("Fleet item added");
      onSave();
    } catch (err) {
      console.error("Error saving fleet item:", err);
      toast.error("Failed to add fleet item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border-2 border-[#333] w-full max-w-lg my-4">
        <div className="bg-[#111] border-b border-[#333] p-4 flex items-center justify-between">
          <h2 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">
            ADD FLEET ITEM
          </h2>
          <button onClick={onClose} className="text-[#666] hover:text-[#F4F4F5]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-['Oswald'] text-[#999] mb-1">NAME</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Royal Enfield Himalayan 450"
              className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-['Oswald'] text-[#999] mb-1">CATEGORY</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
            >
              <option value="bike">BIKE</option>
              <option value="gear">GEAR</option>
              <option value="advisory">ADVISORY</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-['Oswald'] text-[#999] mb-1">DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
            />
          </div>

          {form.category === "bike" && (
            <>
              <div>
                <label className="block text-xs font-['Oswald'] text-[#999] mb-1">IMAGE URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-['Oswald'] text-[#999] mb-1">TERRAIN TYPES (comma-separated)</label>
                <input
                  type="text"
                  value={form.terrainRaw}
                  onChange={(e) => setForm((p) => ({ ...p, terrainRaw: e.target.value }))}
                  placeholder="HIGH-ALTITUDE, MOUNTAIN, ALL-TERRAIN"
                  className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-['Oswald'] text-[#999] mb-1">PROS (one per line)</label>
                  <textarea
                    value={form.prosRaw}
                    onChange={(e) => setForm((p) => ({ ...p, prosRaw: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-['Oswald'] text-[#999] mb-1">CONS (one per line)</label>
                  <textarea
                    value={form.consRaw}
                    onChange={(e) => setForm((p) => ({ ...p, consRaw: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {form.category === "gear" && (
            <div>
              <label className="block text-xs font-['Oswald'] text-[#999] mb-1">ESSENTIALS CHECKLIST (one per line)</label>
              <textarea
                value={form.essentialsRaw}
                onChange={(e) => setForm((p) => ({ ...p, essentialsRaw: e.target.value }))}
                rows={4}
                placeholder="Full-face dual-sport helmet&#10;Clear visor + tinted visor&#10;..."
                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
              />
            </div>
          )}

          {form.category === "advisory" && (
            <div>
              <label className="block text-xs font-['Oswald'] text-[#999] mb-1">CRITICAL TIPS (one per line)</label>
              <textarea
                value={form.tipsRaw}
                onChange={(e) => setForm((p) => ({ ...p, tipsRaw: e.target.value }))}
                rows={4}
                placeholder="Consult a doctor about Diamox&#10;Hydrate aggressively - 4L/day&#10;..."
                className="w-full bg-[#1A1A1A] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#333] text-[#999] hover:text-[#F4F4F5] font-['Oswald'] text-sm tracking-wider transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-sm tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all disabled:opacity-50"
            >
              {loading ? "SAVING..." : "ADD ITEM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const { accessToken, isAdmin, adminUser, setAccessToken, setIsAdmin, setAdminUser } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("tours");
  const [tours, setTours] = useState<any[]>([]);
  const [fleetItems, setFleetItems] = useState<any[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [isMapPointModalOpen, setIsMapPointModalOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [viewingDocPermitId, setViewingDocPermitId] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !isAdmin) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [accessToken, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [toursData, fleetData, mapData, permitsData] = await Promise.all([
        api.getTours(),
        api.getFleet(),
        api.getMapPoints(),
        api.getPermits(accessToken!).catch(() => ({ permits: [] })),
      ]);
      setTours(toursData.tours || []);
      setFleetItems(fleetData.items || []);
      setMapPoints(mapData.points || []);
      setPermits(permitsData.permits || []);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setIsAdmin(false);
    setAdminUser(null);
    navigate("/admin/login");
  };

  const handleDeleteTour = async (slug: string) => {
    if (!confirm(`Delete tour "${slug}"?`)) return;
    try {
      await api.deleteTour(slug, accessToken!);
      setTours((prev) => prev.filter((t) => t.slug !== slug));
      toast.success("Tour deleted");
    } catch (err) {
      console.error("Error deleting tour:", err);
      toast.error("Failed to delete tour");
    }
  };

  const handleDeleteMapPoint = async (id: string) => {
    if (!confirm(`Delete map point "${id}"?`)) return;
    try {
      await api.deleteMapPoint(id, accessToken!);
      setMapPoints((prev) => prev.filter((p) => p.id !== id));
      toast.success("Map point deleted");
    } catch (err) {
      console.error("Error deleting map point:", err);
      toast.error("Failed to delete map point");
    }
  };

  const handleDeleteFleetItem = async (id: string) => {
    if (!confirm(`Delete fleet item "${id}"?`)) return;
    try {
      await api.deleteFleetItem(id, accessToken!);
      setFleetItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Fleet item deleted");
    } catch (err) {
      console.error("Error deleting fleet item:", err);
      toast.error("Failed to delete fleet item");
    }
  };

  const handleUpdatePermitStatus = async (id: string, status: string) => {
    try {
      await api.updatePermit(id, { status }, accessToken!);
      setPermits((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      toast.success(`Permit ${status.toLowerCase()}`);
    } catch (err) {
      console.error("Error updating permit:", err);
      toast.error("Failed to update permit");
    }
  };

  const handleViewDocument = async (permitId: string) => {
    setViewingDocPermitId(permitId);
    setDocLoading(true);
    try {
      const result = await api.getPermitDocument(permitId, accessToken!);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      console.error("Error fetching document URL:", err);
      toast.error(err.message || "Could not retrieve document");
    } finally {
      setDocLoading(false);
      setViewingDocPermitId(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "VERIFIED": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "REJECTED": return "text-red-500 bg-red-500/10 border-red-500/30";
      default: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  const tabs: { key: AdminTab; label: string; icon: any; count: number }[] = [
    { key: "tours", label: "EXPEDITIONS", icon: Route, count: tours.length },
    { key: "fleet", label: "FLEET & GEAR", icon: Bike, count: fleetItems.length },
    { key: "map", label: "MAP POINTS", icon: MapPin, count: mapPoints.length },
    { key: "permits", label: "PERMITS", icon: FileText, count: permits.length },
  ];

  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Admin Header */}
      <div className="bg-[#111] border-b-2 border-[#D85A21] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#E5FF00] rounded-full animate-pulse" />
              <span className="font-['Oswald'] text-xs tracking-widest text-[#E5FF00]">
                ADMIN PANEL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-['Oswald'] font-bold mt-1">
              CONTROL <span className="text-[#D85A21]">CENTER</span>
            </h1>
            {adminUser && (
              <span className="text-[#666] text-xs">{adminUser.email}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="w-10 h-10 border-2 border-[#333] flex items-center justify-center text-[#999] hover:text-[#D85A21] hover:border-[#D85A21] transition-colors"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#333] text-[#999] hover:border-red-500 hover:text-red-500 font-['Oswald'] text-sm tracking-wider transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2.5} />
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Stats bar ── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "EXPEDITIONS", value: tours.length, accent: "#D85A21" },
              { label: "FLEET ITEMS", value: fleetItems.length, accent: "#E5FF00" },
              { label: "MAP POINTS", value: mapPoints.length, accent: "#22C55E" },
              {
                label: "PERMITS",
                value: permits.length,
                sub: permits.filter((p) => p.status === "PENDING").length > 0
                  ? `${permits.filter((p) => p.status === "PENDING").length} PENDING`
                  : "ALL CLEAR",
                subColor: permits.filter((p) => p.status === "PENDING").length > 0 ? "#E5FF00" : "#22C55E",
                accent: "#3B82F6",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#111] border border-[#2A2A2A] px-4 py-3"
                style={{ borderLeftWidth: 3, borderLeftColor: stat.accent }}
              >
                <p className="font-['Oswald'] text-[10px] tracking-widest text-[#555]">{stat.label}</p>
                <p className="font-['Oswald'] text-2xl font-bold" style={{ color: stat.accent }}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="font-['Oswald'] text-[10px] tracking-wider mt-0.5" style={{ color: stat.subColor }}>
                    {stat.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 font-['Oswald'] text-sm tracking-wider border-2 transition-colors flex-shrink-0 ${
                  activeTab === tab.key
                    ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                    : "border-[#333] text-[#999] hover:border-[#D85A21]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {tab.label}
                <span className={`px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key ? "bg-[#1A1A1A]/30" : "bg-[#333]"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#333] border-t-[#D85A21] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TOURS TAB ── */}
            {activeTab === "tours" && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      setEditingTour(null);
                      setIsTourModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[3px_3px_0px_#D85A21] transition-all"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    NEW EXPEDITION
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#333]">
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">EXPEDITION</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">DIFFICULTY</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">DURATION</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">PRICE</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">NEXT</th>
                        <th className="text-right py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tours.map((tour) => (
                        <tr key={tour.slug} className="border-b border-[#333] hover:bg-[#242424] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-['Oswald'] text-[#F4F4F5] font-bold">{tour.title}</span>
                            <br />
                            <span className="text-[#666] text-xs">{tour.subtitle}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-['Oswald'] tracking-wider ${
                              tour.difficulty === "EXTREME" ? "bg-red-600/20 text-red-500" :
                              tour.difficulty === "HARD" ? "bg-[#D85A21]/20 text-[#D85A21]" :
                              "bg-yellow-600/20 text-yellow-500"
                            }`}>
                              {tour.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#999]">{tour.duration} days</td>
                          <td className="py-3 px-4 text-[#E5FF00] font-['Oswald'] font-bold">₹{tour.price?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-[#999] text-xs">{tour.nextDeparture}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingTour(tour);
                                  setIsTourModalOpen(true);
                                }}
                                className="w-8 h-8 inline-flex items-center justify-center text-[#666] hover:text-[#F4F4F5] transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleDeleteTour(tour.slug)}
                                className="w-8 h-8 inline-flex items-center justify-center text-[#666] hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tours.length === 0 && (
                    <div className="text-center py-10 text-[#666] font-['Oswald'] text-sm tracking-wider">
                      NO EXPEDITIONS YET — CREATE ONE ABOVE
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FLEET TAB ── */}
            {activeTab === "fleet" && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setIsFleetModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[3px_3px_0px_#D85A21] transition-all"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    ADD FLEET ITEM
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fleetItems.map((item) => (
                    <div key={item.id} className="border-2 border-[#333] bg-[#242424] p-4 flex items-start justify-between hover:border-[#D85A21] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-['Oswald'] tracking-wider px-2 py-0.5 ${
                            item.category === "bike" ? "bg-[#D85A21]/20 text-[#D85A21]" :
                            item.category === "gear" ? "bg-[#E5FF00]/10 text-[#E5FF00]" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            {item.category?.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-['Oswald'] text-base font-bold text-[#F4F4F5]">{item.name}</h4>
                        <p className="text-[#999] text-xs mt-1 line-clamp-2">{item.description}</p>
                        {item.terrain && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.terrain.map((t: string) => (
                              <span key={t} className="text-xs px-1.5 py-0.5 bg-[#333] text-[#666]">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteFleetItem(item.id)}
                        className="ml-3 w-8 h-8 flex-shrink-0 inline-flex items-center justify-center text-[#666] hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  {fleetItems.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-[#666] font-['Oswald'] text-sm tracking-wider">
                      NO FLEET ITEMS YET — ADD ONE ABOVE
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MAP TAB ── */}
            {activeTab === "map" && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setIsMapPointModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[3px_3px_0px_#D85A21] transition-all"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    ADD MAP POINT
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#333]">
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">TYPE</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">NAME</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">CITY</th>
                        <th className="text-left py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">COORDINATES</th>
                        <th className="text-right py-3 px-4 font-['Oswald'] text-xs tracking-wider text-[#999]">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapPoints.map((point) => (
                        <tr key={point.id} className="border-b border-[#333] hover:bg-[#242424] transition-colors">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-['Oswald'] tracking-wider ${
                              point.type === "mechanic" ? "bg-[#E5FF00]/10 text-[#E5FF00]" :
                              point.type === "fuel" ? "bg-[#D85A21]/10 text-[#D85A21]" :
                              "bg-green-500/10 text-green-500"
                            }`}>
                              {point.type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-['Oswald'] text-[#F4F4F5]">{point.name}</td>
                          <td className="py-3 px-4 text-[#999]">{point.city}</td>
                          <td className="py-3 px-4 text-[#666] font-mono text-xs">{point.lat?.toFixed(4)}, {point.lng?.toFixed(4)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteMapPoint(point.id)}
                              className="w-8 h-8 inline-flex items-center justify-center text-[#666] hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mapPoints.length === 0 && (
                    <div className="text-center py-10 text-[#666] font-['Oswald'] text-sm tracking-wider">
                      NO MAP POINTS YET — ADD ONE ABOVE
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PERMITS TAB ── */}
            {activeTab === "permits" && (
              <div className="space-y-4">
                {permits.length === 0 ? (
                  <div className="text-center py-12 text-[#999]">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-[#333]" strokeWidth={2.5} />
                    <p className="font-['Oswald'] text-sm tracking-wider">NO PERMIT APPLICATIONS YET</p>
                  </div>
                ) : (
                  permits.map((permit) => (
                    <div key={permit.id} className="border-2 border-[#333] bg-[#242424] p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-['Oswald'] text-base font-bold text-[#F4F4F5]">
                              {permit.fullName}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs font-['Oswald'] tracking-wider border ${statusColor(permit.status)}`}>
                              {permit.status}
                            </span>
                            {permit.documentPath && (
                              <span className="flex items-center gap-1 text-xs text-[#E5FF00] bg-[#E5FF00]/10 px-2 py-0.5">
                                <FileText className="w-3 h-3" strokeWidth={2.5} />
                                DOC UPLOADED
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#999]">
                            <span>{permit.email}</span>
                            <span className="text-[#D85A21] font-['Oswald']">{permit.destination}</span>
                            <span>{permit.idType}: {permit.idNumber}</span>
                            <span>DL: {permit.dlNumber}</span>
                            {permit.phone && <span>📞 {permit.phone}</span>}
                          </div>
                          <span className="text-[#666] text-xs mt-1 block">
                            Submitted: {new Date(permit.submittedAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          {permit.documentPath && (
                            <button
                              onClick={() => handleViewDocument(permit.id)}
                              disabled={docLoading && viewingDocPermitId === permit.id}
                              className="flex items-center gap-1.5 px-3 py-2 border-2 border-[#E5FF00]/30 text-[#E5FF00] font-['Oswald'] text-xs tracking-wider hover:bg-[#E5FF00]/10 transition-colors disabled:opacity-50"
                            >
                              {docLoading && viewingDocPermitId === permit.id ? (
                                <div className="w-3 h-3 border border-[#E5FF00] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />
                              )}
                              VIEW DOC
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdatePermitStatus(permit.id, "VERIFIED")}
                            className="px-3 py-2 border-2 border-blue-500/30 text-blue-500 font-['Oswald'] text-xs tracking-wider hover:bg-blue-500/10 transition-colors"
                          >
                            VERIFY
                          </button>
                          <button
                            onClick={() => handleUpdatePermitStatus(permit.id, "APPROVED")}
                            className="px-3 py-2 border-2 border-green-500/30 text-green-500 font-['Oswald'] text-xs tracking-wider hover:bg-green-500/10 transition-colors"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleUpdatePermitStatus(permit.id, "REJECTED")}
                            className="px-3 py-2 border-2 border-red-500/30 text-red-500 font-['Oswald'] text-xs tracking-wider hover:bg-red-500/10 transition-colors"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isTourModalOpen && (
        <TourForm
          tour={editingTour}
          onClose={() => setIsTourModalOpen(false)}
          onSave={() => {
            setIsTourModalOpen(false);
            loadData();
          }}
        />
      )}
      {isMapPointModalOpen && (
        <MapPointForm
          onClose={() => setIsMapPointModalOpen(false)}
          onSave={() => {
            setIsMapPointModalOpen(false);
            loadData();
          }}
        />
      )}
      {isFleetModalOpen && (
        <FleetItemForm
          onClose={() => setIsFleetModalOpen(false)}
          onSave={() => {
            setIsFleetModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}