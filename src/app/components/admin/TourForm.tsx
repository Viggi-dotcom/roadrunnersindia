import { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Shield, CalendarDays, Info } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { useStore } from "../../store";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  elevation: number;
  distance: number;
}

type FormTab = "details" | "itinerary" | "fleet";

interface TourFormProps {
  tour?: any;
  onClose: () => void;
  onSave: () => void;
}

const INPUT_CLS =
  "w-full bg-[#0D0D0D] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none placeholder:text-[#444] transition-colors";
const LABEL_CLS = "block text-[10px] font-['Oswald'] tracking-widest text-[#666] mb-1 uppercase";

export function TourForm({ tour, onClose, onSave }: TourFormProps) {
  const { accessToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>("details");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // ── Basic fields ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    difficulty: "MODERATE",
    duration: 7,
    price: 0,
    nextDeparture: "",
    image: "",
    terrain: "MOUNTAIN",
    elevation: { min: 0, max: 0 },
    maxGroupSize: 10,
  });

  // ── Itinerary ──────────────────────────────────────────────────────────────
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  // ── Shadow Fleet ───────────────────────────────────────────────────────────
  const [shadowFleet, setShadowFleet] = useState<string[]>([]);

  useEffect(() => {
    if (tour) {
      setFormData({
        slug: tour.slug ?? "",
        title: tour.title ?? "",
        subtitle: tour.subtitle ?? "",
        description: tour.description ?? "",
        difficulty: tour.difficulty ?? "MODERATE",
        duration: tour.duration ?? 7,
        price: tour.price ?? 0,
        nextDeparture: tour.nextDeparture ?? "",
        image: tour.image ?? "",
        terrain: tour.terrain ?? "MOUNTAIN",
        elevation: tour.elevation ?? { min: 0, max: 0 },
        maxGroupSize: tour.maxGroupSize ?? 10,
      });
      setItinerary(
        (tour.itinerary || []).map((d: any, i: number) => ({
          day: d.day ?? i + 1,
          title: d.title ?? "",
          description: d.description ?? "",
          elevation: d.elevation ?? 0,
          distance: d.distance ?? 0,
        }))
      );
      setShadowFleet(tour.shadowFleet || []);
    }
  }, [tour]);

  // ── Itinerary helpers ──────────────────────────────────────────────────────
  const addDay = () => {
    setItinerary((prev) => [
      ...prev,
      { day: prev.length + 1, title: "", description: "", elevation: 0, distance: 0 },
    ]);
    setExpandedDay(itinerary.length); // expand the new day
  };

  const removeDay = (idx: number) => {
    setItinerary((prev) =>
      prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }))
    );
    setExpandedDay(null);
  };

  const updateDay = (idx: number, field: keyof ItineraryDay, value: any) => {
    setItinerary((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  };

  const moveDay = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= itinerary.length) return;
    const arr = [...itinerary];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setItinerary(arr.map((d, i) => ({ ...d, day: i + 1 })));
    setExpandedDay(newIdx);
  };

  /** Pad itinerary to match `formData.duration` */
  const syncDays = () => {
    const count = formData.duration;
    if (itinerary.length < count) {
      const extras: ItineraryDay[] = Array.from(
        { length: count - itinerary.length },
        (_, i) => ({
          day: itinerary.length + i + 1,
          title: `Day ${itinerary.length + i + 1}`,
          description: "",
          elevation: 0,
          distance: 0,
        })
      );
      setItinerary((prev) => [...prev, ...extras]);
    } else {
      toast.error("Remove days manually — sync only adds, never deletes");
    }
  };

  // ── Shadow Fleet helpers ───────────────────────────────────────────────────
  const addFleetItem = () => setShadowFleet((prev) => [...prev, ""]);
  const removeFleetItem = (idx: number) =>
    setShadowFleet((prev) => prev.filter((_, i) => i !== idx));
  const updateFleetItem = (idx: number, val: string) =>
    setShadowFleet((prev) => prev.map((item, i) => (i === idx ? val : item)));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug || !formData.title) {
      toast.error("Title and Slug are required");
      setActiveTab("details");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        itinerary: itinerary.filter((d) => d.title.trim()),
        shadowFleet: shadowFleet.filter((s) => s.trim()),
      };
      await api.saveTour(payload, accessToken!);
      toast.success(tour ? "Expedition updated" : "Expedition created");
      onSave();
    } catch (err) {
      console.error("Error saving tour:", err);
      toast.error("Failed to save expedition");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const TABS: { key: FormTab; label: string; icon: any; count?: number }[] = [
    { key: "details", label: "BASIC INFO", icon: Info },
    { key: "itinerary", label: "ITINERARY", icon: CalendarDays, count: itinerary.length },
    { key: "fleet", label: "SHADOW FLEET", icon: Shield, count: shadowFleet.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border-2 border-[#333] w-full max-w-3xl my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="sticky top-0 bg-[#111] border-b-2 border-[#D85A21] px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <p className="font-['Oswald'] text-[10px] tracking-widest text-[#D85A21]">
              {tour ? "EDITING" : "NEW"}
            </p>
            <h2 className="font-['Oswald'] text-xl font-bold text-[#F4F4F5] leading-tight">
              {tour ? tour.title || "EXPEDITION" : "NEW EXPEDITION"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#666] hover:text-[#F4F4F5] hover:bg-[#242424] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#333] flex-shrink-0 bg-[#161616]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 font-['Oswald'] text-xs tracking-widest border-b-2 transition-colors flex-1 justify-center ${
                  activeTab === tab.key
                    ? "border-[#D85A21] text-[#D85A21] bg-[#1A1A1A]"
                    : "border-transparent text-[#555] hover:text-[#999]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#333] text-[#999]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* ── TAB: DETAILS ── */}
            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>TITLE *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title,
                          slug: !tour
                            ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                            : prev.slug,
                        }));
                      }}
                      placeholder="LADAKH ODYSSEY"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>SLUG (URL ID) {tour && "— locked"}</label>
                    <input
                      type="text"
                      value={formData.slug}
                      disabled={!!tour}
                      onChange={(e) => handleChange("slug", e.target.value)}
                      className={`${INPUT_CLS} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>SUBTITLE</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => handleChange("subtitle", e.target.value)}
                      placeholder="Manali to Leh via Khardung La"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>DESCRIPTION</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={4}
                      placeholder="Full expedition description shown to riders..."
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>PRICE (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange("price", Number(e.target.value))}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>DURATION (DAYS)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleChange("duration", Number(e.target.value))}
                      min={1}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>DIFFICULTY</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleChange("difficulty", e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="MODERATE">MODERATE</option>
                      <option value="HARD">HARD</option>
                      <option value="EXTREME">EXTREME</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>TERRAIN TYPE</label>
                    <select
                      value={formData.terrain}
                      onChange={(e) => handleChange("terrain", e.target.value)}
                      className={INPUT_CLS}
                    >
                      {["HIGH-ALTITUDE", "MOUNTAIN", "DESERT", "JUNGLE", "ICE", "MIXED"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL_CLS}>NEXT DEPARTURE</label>
                    <input
                      type="date"
                      value={formData.nextDeparture}
                      onChange={(e) => handleChange("nextDeparture", e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>MAX GROUP SIZE</label>
                    <input
                      type="number"
                      value={formData.maxGroupSize}
                      onChange={(e) => handleChange("maxGroupSize", Number(e.target.value))}
                      min={1}
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>MIN ELEVATION (m)</label>
                    <input
                      type="number"
                      value={formData.elevation.min}
                      onChange={(e) =>
                        handleChange("elevation", { ...formData.elevation, min: Number(e.target.value) })
                      }
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>MAX ELEVATION (m)</label>
                    <input
                      type="number"
                      value={formData.elevation.max}
                      onChange={(e) =>
                        handleChange("elevation", { ...formData.elevation, max: Number(e.target.value) })
                      }
                      className={INPUT_CLS}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={LABEL_CLS}>HERO IMAGE URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleChange("image", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={INPUT_CLS}
                    />
                    {formData.image && (
                      <div className="mt-2 h-24 overflow-hidden border border-[#333]">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ITINERARY ── */}
            {activeTab === "itinerary" && (
              <div>
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-['Oswald'] text-xs tracking-widest text-[#666]">
                      {itinerary.length} / {formData.duration} DAYS DEFINED
                    </span>
                    {itinerary.length < formData.duration && (
                      <button
                        type="button"
                        onClick={syncDays}
                        className="text-[10px] font-['Oswald'] tracking-wider text-[#E5FF00] border border-[#E5FF00]/30 px-2 py-1 hover:bg-[#E5FF00]/10 transition-colors"
                      >
                        SYNC TO {formData.duration} DAYS
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addDay}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-xs tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ADD DAY
                  </button>
                </div>

                {itinerary.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-[#333]">
                    <CalendarDays className="w-10 h-10 text-[#333] mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-['Oswald'] text-sm text-[#555] tracking-wider">
                      NO DAYS YET
                    </p>
                    <p className="text-xs text-[#444] mt-1">
                      Click "ADD DAY" or "SYNC" to populate the itinerary
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {itinerary.map((day, idx) => {
                    const isExpanded = expandedDay === idx;
                    return (
                      <div
                        key={idx}
                        className={`border-2 transition-colors ${
                          isExpanded ? "border-[#D85A21] bg-[#242424]" : "border-[#2A2A2A] bg-[#1E1E1E]"
                        }`}
                      >
                        {/* Day header row */}
                        <div className="flex items-center gap-2 px-3 py-2">
                          {/* Day badge */}
                          <span className="w-8 h-8 bg-[#D85A21] flex items-center justify-center font-['Oswald'] text-xs font-bold text-[#1A1A1A] flex-shrink-0">
                            {String(day.day).padStart(2, "0")}
                          </span>

                          {/* Title input */}
                          <input
                            type="text"
                            value={day.title}
                            onChange={(e) => updateDay(idx, "title", e.target.value)}
                            placeholder={`Day ${day.day} title...`}
                            className="flex-1 bg-transparent text-[#F4F4F5] font-['Oswald'] text-sm focus:outline-none placeholder:text-[#444] min-w-0"
                          />

                          {/* Elevation */}
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              value={day.elevation}
                              onChange={(e) => updateDay(idx, "elevation", Number(e.target.value))}
                              className="w-16 bg-[#0D0D0D] border border-[#333] px-2 py-1 text-[#F4F4F5] text-xs text-right focus:border-[#D85A21] outline-none"
                              title="Elevation (m)"
                            />
                            <span className="text-[#555] text-[10px]">m</span>
                          </div>

                          {/* Distance */}
                          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              value={day.distance}
                              onChange={(e) => updateDay(idx, "distance", Number(e.target.value))}
                              className="w-14 bg-[#0D0D0D] border border-[#333] px-2 py-1 text-[#F4F4F5] text-xs text-right focus:border-[#D85A21] outline-none"
                              title="Distance (km)"
                            />
                            <span className="text-[#555] text-[10px]">km</span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveDay(idx, -1)}
                              disabled={idx === 0}
                              className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-[#F4F4F5] disabled:opacity-20 transition-colors"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDay(idx, 1)}
                              disabled={idx === itinerary.length - 1}
                              className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-[#F4F4F5] disabled:opacity-20 transition-colors"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedDay(isExpanded ? null : idx)}
                              className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-[#D85A21] transition-colors"
                              title="Edit description"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDay(idx)}
                              className="w-6 h-6 flex items-center justify-center text-[#444] hover:text-red-500 transition-colors"
                              title="Remove day"
                            >
                              <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded: mobile elevation/distance + description */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-[#333] pt-3 space-y-3">
                            {/* Mobile-only elevation/distance */}
                            <div className="flex sm:hidden gap-4">
                              <div className="flex items-center gap-1.5">
                                <label className="text-[10px] text-[#555] font-['Oswald'] tracking-wider">ELEV</label>
                                <input
                                  type="number"
                                  value={day.elevation}
                                  onChange={(e) => updateDay(idx, "elevation", Number(e.target.value))}
                                  className="w-20 bg-[#0D0D0D] border border-[#333] px-2 py-1 text-[#F4F4F5] text-xs focus:border-[#D85A21] outline-none"
                                />
                                <span className="text-[#555] text-[10px]">m</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <label className="text-[10px] text-[#555] font-['Oswald'] tracking-wider">DIST</label>
                                <input
                                  type="number"
                                  value={day.distance}
                                  onChange={(e) => updateDay(idx, "distance", Number(e.target.value))}
                                  className="w-20 bg-[#0D0D0D] border border-[#333] px-2 py-1 text-[#F4F4F5] text-xs focus:border-[#D85A21] outline-none"
                                />
                                <span className="text-[#555] text-[10px]">km</span>
                              </div>
                            </div>

                            <div>
                              <label className={LABEL_CLS}>DESCRIPTION</label>
                              <textarea
                                value={day.description}
                                onChange={(e) => updateDay(idx, "description", e.target.value)}
                                rows={3}
                                placeholder="What riders will experience on this day..."
                                className={INPUT_CLS}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {itinerary.length > 0 && (
                  <div className="mt-4 p-3 bg-[#0D0D0D] border border-[#222] text-[10px] text-[#444] font-['Oswald'] tracking-wider">
                    TOTAL: {itinerary.reduce((s, d) => s + (d.distance || 0), 0)} KM ·{" "}
                    MAX {Math.max(...itinerary.map((d) => d.elevation || 0)).toLocaleString()}M
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: SHADOW FLEET ── */}
            {activeTab === "fleet" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-['Oswald'] text-xs tracking-widest text-[#666]">
                      WHAT'S ON EVERY RIDE
                    </p>
                    <p className="text-[#444] text-xs mt-0.5">
                      List each item in the shadow fleet that supports this expedition
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addFleetItem}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-xs tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ADD ITEM
                  </button>
                </div>

                {shadowFleet.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-[#333]">
                    <Shield className="w-10 h-10 text-[#333] mx-auto mb-3" strokeWidth={1.5} />
                    <p className="font-['Oswald'] text-sm text-[#555] tracking-wider">
                      NO FLEET ITEMS
                    </p>
                    <p className="text-xs text-[#444] mt-1">
                      Add backup bikes, chase vehicles, medical kits, etc.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {shadowFleet.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#D85A21]/10 border border-[#D85A21]/30 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3 h-3 text-[#D85A21]" strokeWidth={2.5} />
                      </div>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateFleetItem(idx, e.target.value)}
                        placeholder={`Fleet item ${idx + 1}...`}
                        className="flex-1 bg-[#0D0D0D] border border-[#333] px-3 py-2 text-[#F4F4F5] text-sm focus:border-[#D85A21] outline-none transition-colors placeholder:text-[#444]"
                      />
                      <button
                        type="button"
                        onClick={() => removeFleetItem(idx)}
                        className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>

                {shadowFleet.length > 0 && (
                  <p className="mt-4 text-[10px] text-[#444] font-['Oswald'] tracking-wider">
                    {shadowFleet.filter((s) => s.trim()).length} ITEM
                    {shadowFleet.filter((s) => s.trim()).length !== 1 ? "S" : ""} WILL BE SAVED
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex-shrink-0 border-t border-[#333] bg-[#111] px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {TABS.filter((t) => t.key !== activeTab).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className="text-[10px] font-['Oswald'] tracking-wider text-[#555] hover:text-[#999] transition-colors"
                >
                  → {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-[#333] text-[#666] hover:text-[#F4F4F5] hover:border-[#555] font-['Oswald'] text-sm tracking-wider transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "SAVING..." : tour ? "SAVE CHANGES" : "CREATE EXPEDITION"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
