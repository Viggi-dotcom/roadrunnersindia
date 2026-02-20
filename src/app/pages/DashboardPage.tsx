import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  User,
  Mail,
  MapPin,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { api, generateWhatsAppLink } from "../lib/api";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "text-green-500 border-green-500/40 bg-green-500/10",
  VERIFIED: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  REJECTED: "text-red-500 border-red-500/40 bg-red-500/10",
  PENDING: "text-yellow-500 border-yellow-500/40 bg-yellow-500/10",
};

const STATUS_ICON: Record<string, any> = {
  APPROVED: CheckCircle,
  VERIFIED: Shield,
  REJECTED: X,
  PENDING: Clock,
};

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"permits" | "sos">("permits");

  // ── Permit application state ──────────────────────────────────────────────
  const [permitForm, setPermitForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    destination: "",
    idType: "AADHAAR",
    idNumber: "",
    dlNumber: "",
    documentPath: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Permit status checker state ───────────────────────────────────────────
  const [statusEmail, setStatusEmail] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResults, setStatusResults] = useState<any[] | null>(null);
  const [statusError, setStatusError] = useState("");

  const handleSubmitPermit = async () => {
    if (!permitForm.fullName || !permitForm.email || !permitForm.idNumber || !permitForm.dlNumber) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!file) {
      toast.error("Please upload your ID/Permit document");
      return;
    }
    setSubmitting(true);
    try {
      setUploading(true);
      const uploadRes = await api.uploadFile(file, "permits");
      setUploading(false);
      if (uploadRes.error) throw new Error(uploadRes.error);
      const permitData = { ...permitForm, documentPath: uploadRes.path };
      await api.submitPermit(permitData);
      setSubmitted(true);
      toast.success("Permit application submitted successfully!");
    } catch (err) {
      console.error("Error submitting permit:", err);
      toast.error("Failed to submit permit application");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusEmail.trim()) {
      toast.error("Enter your email address to check status");
      return;
    }
    setStatusLoading(true);
    setStatusError("");
    setStatusResults(null);
    try {
      const data = await api.getPermitsByEmail(statusEmail.trim());
      setStatusResults(data.permits || []);
      if ((data.permits || []).length === 0) {
        setStatusError("No applications found for this email address.");
      }
    } catch (err: any) {
      console.error("Error checking status:", err);
      setStatusError(err.message || "Failed to check status");
    } finally {
      setStatusLoading(false);
    }
  };

  const SOS_ITEMS = [
    { label: "Emergency Contact", value: "+91-112 (National Emergency)", icon: Phone },
    { label: "SDRF Ladakh", value: "+91-1982-252527", icon: Shield },
    { label: "RoadRunners Emergency", value: "Contact via WhatsApp", icon: AlertTriangle },
    { label: "Nearest Hospital", value: "Check Pit-Stop Map", icon: MapPin },
  ];

  const CHECKLIST = [
    "Bike service completed (oil, chain, brakes)",
    "Tyre pressure checked (front & rear)",
    "Toolkit + puncture repair kit packed",
    "Riding gear: helmet, jacket, gloves, boots",
    "Documents: DL, RC, insurance, ILP (if needed)",
    "First-aid kit with altitude medication",
    "Hydration pack + electrolytes",
    "Warm layers for high-altitude cold",
    "Rain gear / waterproof covers",
    "USB charger + power bank",
    "Downloaded offline maps",
    "Emergency contacts saved on phone",
  ];

  return (
    <div className="bg-[#1A1A1A] min-h-screen">
      {/* Header */}
      <div className="bg-[#111] border-b-2 border-[#333] py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <span className="font-['Oswald'] text-xs tracking-widest text-[#D85A21]">
            RIDER PORTAL
          </span>
          <h1 className="text-4xl sm:text-5xl font-['Oswald'] font-bold mt-2">
            YOUR <span className="text-[#D85A21]">DASHBOARD</span>
          </h1>
          <p className="text-[#999] text-lg mt-4">
            Manage permits, access emergency info, and prep for your expedition.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: "permits" as const, label: "PERMIT ENGINE", icon: FileText },
            { key: "sos" as const, label: "SOS & CHECKLIST", icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 font-['Oswald'] text-sm tracking-wider border-2 transition-colors ${
                  activeTab === tab.key
                    ? "bg-[#D85A21] border-[#D85A21] text-[#F4F4F5]"
                    : "border-[#333] text-[#999] hover:border-[#D85A21]"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── PERMITS TAB ── */}
        {activeTab === "permits" && (
          <div className="space-y-8">
            {/* Application Form / Success */}
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-[#E5FF00]/30 bg-[#242424] p-8 text-center"
              >
                <CheckCircle className="w-16 h-16 text-[#E5FF00] mx-auto mb-4" strokeWidth={2.5} />
                <h3 className="font-['Oswald'] text-2xl font-bold text-[#F4F4F5] mb-2">
                  APPLICATION SUBMITTED
                </h3>
                <p className="text-[#999] mb-6">
                  Your permit application has been received. Our team will verify your documents and update the status.
                  You'll be contacted on WhatsApp with updates.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#333] text-[#E5FF00] font-['Oswald'] text-sm tracking-wider">
                    <Clock className="w-4 h-4" strokeWidth={2.5} />
                    STATUS: PENDING VERIFICATION
                  </div>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setPermitForm({
                        fullName: "", email: "", phone: "", destination: "",
                        idType: "AADHAAR", idNumber: "", dlNumber: "", documentPath: "",
                      });
                      setFile(null);
                    }}
                    className="px-4 py-2 border-2 border-[#333] text-[#999] font-['Oswald'] text-sm tracking-wider hover:border-[#D85A21] hover:text-[#D85A21] transition-colors"
                  >
                    SUBMIT ANOTHER
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="border-2 border-[#333] bg-[#242424] p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-[#E5FF00]" strokeWidth={2.5} />
                  <h3 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">
                    ILP / PERMIT APPLICATION
                  </h3>
                </div>
                <p className="text-[#999] text-sm mb-6">
                  Certain expedition areas (Ladakh, Arunachal Pradesh, Sikkim, etc.) require Inner Line Permits.
                  Submit your details and we'll handle the processing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">FULL NAME *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={2.5} />
                      <input
                        type="text"
                        value={permitForm.fullName}
                        onChange={(e) => setPermitForm({ ...permitForm, fullName: e.target.value })}
                        className="w-full bg-[#1A1A1A] border-2 border-[#333] px-10 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                        placeholder="As on ID proof"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">EMAIL *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={2.5} />
                      <input
                        type="email"
                        value={permitForm.email}
                        onChange={(e) => setPermitForm({ ...permitForm, email: e.target.value })}
                        className="w-full bg-[#1A1A1A] border-2 border-[#333] px-10 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">PHONE</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" strokeWidth={2.5} />
                      <input
                        type="tel"
                        value={permitForm.phone}
                        onChange={(e) => setPermitForm({ ...permitForm, phone: e.target.value })}
                        className="w-full bg-[#1A1A1A] border-2 border-[#333] px-10 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                        placeholder="+91-XXXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">DESTINATION</label>
                    <select
                      value={permitForm.destination}
                      onChange={(e) => setPermitForm({ ...permitForm, destination: e.target.value })}
                      className="w-full bg-[#1A1A1A] border-2 border-[#333] px-4 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select destination</option>
                      <option value="LADAKH">Ladakh</option>
                      <option value="SPITI">Spiti Valley</option>
                      <option value="ARUNACHAL">Arunachal Pradesh</option>
                      <option value="SIKKIM">Sikkim</option>
                      <option value="MEGHALAYA">Meghalaya</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">ID TYPE</label>
                    <select
                      value={permitForm.idType}
                      onChange={(e) => setPermitForm({ ...permitForm, idType: e.target.value })}
                      className="w-full bg-[#1A1A1A] border-2 border-[#333] px-4 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors appearance-none"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="VOTER_ID">Voter ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">ID NUMBER *</label>
                    <input
                      type="text"
                      value={permitForm.idNumber}
                      onChange={(e) => setPermitForm({ ...permitForm, idNumber: e.target.value })}
                      className="w-full bg-[#1A1A1A] border-2 border-[#333] px-4 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                      placeholder="ID number"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">DRIVING LICENSE NUMBER *</label>
                    <input
                      type="text"
                      value={permitForm.dlNumber}
                      onChange={(e) => setPermitForm({ ...permitForm, dlNumber: e.target.value })}
                      className="w-full bg-[#1A1A1A] border-2 border-[#333] px-4 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                      placeholder="DL-XXXXXXXXXXXX"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-['Oswald'] text-xs tracking-wider text-[#999] mb-1 block">UPLOAD ID / PERMIT DOCUMENT *</label>
                    <div
                      className="relative border-2 border-dashed border-[#333] p-6 text-center hover:border-[#D85A21] transition-colors cursor-pointer bg-[#1A1A1A]"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFile(f);
                        }}
                      />
                      {file ? (
                        <div className="flex items-center justify-center gap-2 text-[#E5FF00]">
                          <FileText className="w-5 h-5" />
                          <span className="font-['Oswald'] text-sm tracking-wide">{file.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="ml-2 text-[#666] hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-[#666] mx-auto mb-2" />
                          <p className="text-[#999] text-xs">CLICK TO UPLOAD (JPG, PNG, PDF)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitPermit}
                  disabled={submitting || uploading}
                  className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#E5FF00] text-[#1A1A1A] font-['Oswald'] text-base font-bold tracking-wider hover:shadow-[4px_4px_0px_#D85A21] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting || uploading ? (
                    <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" strokeWidth={2.5} />
                  )}
                  {uploading ? "UPLOADING..." : submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                </button>
              </div>
            )}

            {/* ── Permit Status Checker ── */}
            <div className="border-2 border-[#333] bg-[#111] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-[#E5FF00]" strokeWidth={2.5} />
                <h3 className="font-['Oswald'] text-lg font-bold text-[#F4F4F5]">
                  CHECK APPLICATION STATUS
                </h3>
              </div>
              <p className="text-[#666] text-sm mb-5">
                Already submitted? Enter the email you used to track your permit status.
              </p>

              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" strokeWidth={2.5} />
                  <input
                    type="email"
                    value={statusEmail}
                    onChange={(e) => { setStatusEmail(e.target.value); setStatusResults(null); setStatusError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckStatus()}
                    placeholder="email@example.com"
                    className="w-full bg-[#1A1A1A] border-2 border-[#333] pl-10 pr-4 py-3 text-[#F4F4F5] text-sm focus:border-[#D85A21] focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleCheckStatus}
                  disabled={statusLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-sm font-bold tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {statusLoading ? (
                    <div className="w-4 h-4 border-2 border-[#F4F4F5] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" strokeWidth={2.5} />
                  )}
                  CHECK STATUS
                </button>
              </div>

              {/* Results */}
              <AnimatePresence>
                {statusError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-[#666] text-sm font-['Oswald'] tracking-wider"
                  >
                    {statusError}
                  </motion.p>
                )}

                {statusResults && statusResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 space-y-3"
                  >
                    <p className="font-['Oswald'] text-xs tracking-widest text-[#999]">
                      {statusResults.length} APPLICATION{statusResults.length !== 1 ? "S" : ""} FOUND
                    </p>
                    {statusResults.map((permit, i) => {
                      const StatusIcon = STATUS_ICON[permit.status] || Clock;
                      return (
                        <div
                          key={i}
                          className="border-2 border-[#2A2A2A] bg-[#1A1A1A] p-4 flex items-start justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-[#D85A21]" strokeWidth={2.5} />
                              <span className="font-['Oswald'] text-sm text-[#F4F4F5]">
                                {permit.destination || "—"}
                              </span>
                            </div>
                            <p className="text-[#666] text-xs">
                              Submitted: {new Date(permit.submittedAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </p>
                            {permit.updatedAt && (
                              <p className="text-[#555] text-xs mt-0.5">
                                Updated: {new Date(permit.updatedAt).toLocaleDateString("en-IN", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                          <span
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-['Oswald'] tracking-wider border flex-shrink-0 ${
                              STATUS_COLOR[permit.status] || STATUS_COLOR.PENDING
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
                            {permit.status}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-[#555] text-xs pt-1">
                      Questions? Reach us on{" "}
                      <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#D85A21] hover:text-[#E5FF00] transition-colors"
                      >
                        WhatsApp
                      </a>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── SOS & CHECKLIST TAB ── */}
        {activeTab === "sos" && (
          <div className="space-y-6">
            {/* Emergency Contacts */}
            <div className="border-2 border-red-600/30 bg-[#242424] p-6">
              <h3 className="font-['Oswald'] text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
                EMERGENCY CONTACTS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SOS_ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333]">
                      <Icon className="w-5 h-5 text-[#D85A21] flex-shrink-0" strokeWidth={2.5} />
                      <div>
                        <span className="text-[#999] text-xs block">{item.label}</span>
                        <span className="text-[#F4F4F5] text-sm font-bold">{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#D85A21] text-[#F4F4F5] font-['Oswald'] text-sm tracking-wider hover:shadow-[3px_3px_0px_#E5FF00] transition-all"
              >
                <Phone className="w-4 h-4" strokeWidth={2.5} />
                EMERGENCY WHATSAPP
              </a>
            </div>

            {/* Pre-Ride Checklist */}
            <div className="border-2 border-[#333] bg-[#242424] p-6">
              <h3 className="font-['Oswald'] text-lg font-bold text-[#E5FF00] mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                PRE-RIDE CHECKLIST
              </h3>
              <div className="space-y-3">
                {CHECKLIST.map((item, i) => (
                  <ChecklistItem key={i} label={item} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`flex items-center gap-3 w-full text-left p-3 transition-colors ${
        checked ? "bg-[#D85A21]/10 border-l-4 border-[#D85A21]" : "bg-[#1A1A1A] border-l-4 border-[#333]"
      }`}
    >
      <div
        className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? "bg-[#D85A21] border-[#D85A21]" : "border-[#666]"
        }`}
      >
        {checked && <CheckCircle className="w-3 h-3 text-[#1A1A1A]" strokeWidth={3} />}
      </div>
      <span className={`text-sm ${checked ? "text-[#D85A21] line-through" : "text-[#CCC]"}`}>
        {label}
      </span>
    </button>
  );
}
