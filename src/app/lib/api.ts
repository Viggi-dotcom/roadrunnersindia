import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0896aea8`;

// Always use publicAnonKey for the Supabase Edge Functions gateway Authorization header.
// Pass user access tokens via a custom X-User-Token header to avoid gateway JWT rejection.
async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // If caller provided an access token, pass it as X-User-Token
  const optHeaders = options.headers as Record<string, string> | undefined;
  if (optHeaders?.["Authorization"]) {
    const userToken = optHeaders["Authorization"].replace(/^Bearer\s+/i, "");
    headers["X-User-Token"] = userToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method,
    body: options.body,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`API Error [${path}]:`, error);
    throw new Error(error.error || error.message || res.statusText);
  }

  return res.json();
}

export const api = {
  seed: () => request("/seed", { method: "POST" }),

  // Tours
  getTours: () => request("/tours"),
  getTour: (slug: string) => request(`/tours/${slug}`),
  saveTour: (tour: any, accessToken: string) =>
    request("/tours", {
      method: "POST",
      body: JSON.stringify(tour),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  deleteTour: (slug: string, accessToken: string) =>
    request(`/tours/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Fleet
  getFleet: () => request("/fleet"),
  saveFleetItem: (item: any, accessToken: string) =>
    request("/fleet", {
      method: "POST",
      body: JSON.stringify(item),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  deleteFleetItem: (id: string, accessToken: string) =>
    request(`/fleet/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Map Points
  getMapPoints: () => request("/map-points"),
  saveMapPoint: (point: any, accessToken: string) =>
    request("/map-points", {
      method: "POST",
      body: JSON.stringify(point),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  deleteMapPoint: (id: string, accessToken: string) =>
    request(`/map-points/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Permits
  getPermits: (accessToken: string) =>
    request("/permits", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  submitPermit: (permit: any) =>
    request("/permits", { method: "POST", body: JSON.stringify(permit) }),
  updatePermit: (id: string, updates: any, accessToken: string) =>
    request(`/permits/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Permit document — admin gets a 1-hour signed URL
  getPermitDocument: (id: string, accessToken: string) =>
    request(`/permits/${id}/document`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // Permit status lookup by email — public (returns minimal fields only)
  getPermitsByEmail: (email: string) =>
    request(`/permits/by-email?email=${encodeURIComponent(email)}`),

  // File Upload
  uploadFile: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return request("/upload", {
      method: "POST",
      body: formData,
    });
  },

  // Auth
  signup: (email: string, password: string, name: string) =>
    request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  makeAdmin: (userId: string, accessToken?: string) =>
    request("/make-admin", {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }),
  checkAdmin: (accessToken: string) =>
    request("/check-admin", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

// WhatsApp utility
export function generateWhatsAppLink(tourName?: string) {
  const phone = "919702361616"; // RoadRunnersIndia Business Number
  const message = tourName
    ? `Hi RoadRunnersIndia, I am interested in joining the ${tourName} expedition. Please share the details and availability.`
    : `Hi RoadRunnersIndia, I would like to know more about your motorcycle expeditions.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}