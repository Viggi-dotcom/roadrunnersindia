import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

// Helper: verify admin using X-User-Token header (user access token)
async function verifyAdmin(userToken: string | null) {
  if (!userToken) return null;
  try {
    const sb = supabase();
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(userToken);
    if (error || !user) return null;
    const adminFlag = await kv.get(`admin:${user.id}`);
    if (!adminFlag) return null;
    return user;
  } catch (err) {
    console.log("verifyAdmin error:", err);
    return null;
  }
}

// Helper: get authenticated user from X-User-Token header
async function getAuthUser(userToken: string | null) {
  if (!userToken) return null;
  try {
    const sb = supabase();
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(userToken);
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.log("getAuthUser error:", err);
    return null;
  }
}

// Health check
app.get("/make-server-0896aea8/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper: ensure bucket exists
async function ensureBucket(bucketName: string) {
  try {
    const sb = supabase();
    const { data: buckets } = await sb.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);
    if (!bucketExists) {
      await sb.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
      });
      console.log(`Bucket ${bucketName} created.`);
    }
  } catch (err) {
    console.error("Error creating bucket:", err);
  }
}

// Ensure permits bucket exists on startup (or when needed)
ensureBucket("make-0896aea8-permits");

// ============ UPLOAD ============
app.post("/make-server-0896aea8/upload", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    // Allow upload if admin OR if it's a permit submission (which might be public/anon)
    // For now, let's allow anyone with a valid session or anon key to upload for permits?
    // The prompt implies users upload permits.
    
    // We'll check if it's a permit upload or admin upload.
    // Simpler: just allow upload for now, or check for at least anon key (which is checked by gateway usually, but we are inside function).
    
    const body = await c.req.parseBody();
    const file = body["file"];
    const folder = body["folder"] || "misc";

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const sb = supabase();
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await sb.storage
      .from("make-0896aea8-permits")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ path: data.path });
  } catch (err) {
    console.error("Server upload error:", err);
    return c.json({ error: `Upload failed: ${err}` }, 500);
  }
});

// ============ SEED DATA ============
app.post("/make-server-0896aea8/seed", async (c) => {
  try {
    const existing = await kv.get("tours_seeded_v2");
    if (existing) {
      return c.json({ message: "Already seeded" });
    }

    // Seed tours
    const tours = [
      {
        slug: "ladakh-odyssey",
        title: "LADAKH ODYSSEY",
        subtitle: "Manali to Leh via Khardung La",
        description:
          "The ultimate high-altitude expedition through the roof of the world. Cross the highest motorable passes, navigate treacherous Gata Loops, and witness landscapes that defy imagination. This 12-day odyssey pushes rider and machine to the absolute limit.",
        difficulty: "EXTREME",
        duration: 12,
        terrain: "HIGH-ALTITUDE",
        price: 45000,
        maxGroupSize: 12,
        nextDeparture: "2026-06-15",
        image: "https://images.unsplash.com/photo-1652531685884-e46aaa8ad66f?w=800&q=80",
        elevation: { min: 1950, max: 5602 },
        shadowFleet: [
          "Backup Royal Enfield Himalayan 450",
          "Chase SUV with spares",
          "Satellite phone",
          "Portable oxygen concentrator",
          "Full first-aid trauma kit",
          "Emergency evacuation plan",
        ],
        itinerary: [
          { day: 1, title: "Arrival in Manali", description: "Acclimatization day. Bike inspection, gear check, and team briefing at base camp. Evening ride through Old Manali.", elevation: 2050, distance: 15 },
          { day: 2, title: "Manali to Jispa", description: "Cross the Atal Tunnel and ride through Lahaul Valley. First taste of mountain roads.", elevation: 3200, distance: 140 },
          { day: 3, title: "Jispa to Sarchu", description: "Navigate the legendary 21 Gata Loops. Altitude sickness protocols in effect.", elevation: 4290, distance: 85 },
          { day: 4, title: "Sarchu to Leh", description: "Cross Lachalung La and Tanglang La. Descent into the Indus Valley. Arrival in Leh.", elevation: 3500, distance: 260 },
          { day: 5, title: "Leh Rest Day", description: "Acclimatization in Leh. Visit Leh Palace, Shanti Stupa. Bike service and prep.", elevation: 3500, distance: 20 },
          { day: 6, title: "Leh to Nubra Valley", description: "Summit Khardung La (5,602m). Descent to Nubra Valley. Sand dunes and double-humped camels.", elevation: 5602, distance: 120 },
          { day: 7, title: "Nubra Valley to Pangong", description: "Ride through Shyok Valley to the surreal Pangong Tso lake. Camp by the shore.", elevation: 4350, distance: 150 },
          { day: 8, title: "Pangong to Hanle", description: "Remote riding through Chang La. Visit the Hanle Observatory, one of the highest in the world.", elevation: 4500, distance: 160 },
          { day: 9, title: "Hanle to Tso Moriri", description: "Off-road through nomadic lands. Camp beside the pristine Tso Moriri lake.", elevation: 4522, distance: 180 },
          { day: 10, title: "Tso Moriri to Pang", description: "Ride through More Plains - the highest plateau in India. Wild landscapes.", elevation: 4600, distance: 140 },
          { day: 11, title: "Pang to Manali", description: "Full send back through all major passes. Longest riding day. Victory ride into Manali.", elevation: 2050, distance: 320 },
          { day: 12, title: "Departure", description: "Farewell breakfast. Certificate ceremony. Departure.", elevation: 2050, distance: 0 },
        ],
      },
      {
        slug: "spiti-circuit",
        title: "SPITI CIRCUIT",
        subtitle: "The Middle Land - Shimla to Manali Loop",
        description:
          "Explore the ancient Buddhist kingdom of Spiti, where time stands still and the roads challenge every ounce of your riding skill. Monasteries perched on cliffs, fossil-rich valleys, and the treacherous Kunzum Pass await.",
        difficulty: "HARD",
        duration: 10,
        terrain: "MOUNTAIN",
        price: 38000,
        maxGroupSize: 10,
        nextDeparture: "2026-07-01",
        image: "https://images.unsplash.com/photo-1734699865526-efcc499ff560?w=800&q=80",
        elevation: { min: 2200, max: 4590 },
        shadowFleet: [
          "Backup Himalayan 450",
          "Chase vehicle",
          "Satellite phone",
          "First-aid kit",
          "Portable oxygen",
        ],
        itinerary: [
          { day: 1, title: "Shimla Assembly", description: "Team meeting and briefing. Ride through colonial hill station.", elevation: 2200, distance: 0 },
          { day: 2, title: "Shimla to Sarahan", description: "Ride through pine forests to the Bhimakali Temple.", elevation: 2400, distance: 175 },
          { day: 3, title: "Sarahan to Sangla", description: "Enter the Kinnaur Valley. Apple orchards and wooden villages.", elevation: 2680, distance: 95 },
          { day: 4, title: "Sangla to Chitkul", description: "Ride to the last inhabited village before Tibet.", elevation: 3450, distance: 30 },
          { day: 5, title: "Chitkul to Kalpa", description: "Views of the Kinnaur Kailash range. Sacred mountain territory.", elevation: 2960, distance: 80 },
          { day: 6, title: "Kalpa to Tabo", description: "Enter Spiti. Visit the 1000-year-old Tabo Monastery.", elevation: 3280, distance: 170 },
          { day: 7, title: "Tabo to Kaza", description: "The heart of Spiti. Visit Key Monastery and Kibber village.", elevation: 3640, distance: 50 },
          { day: 8, title: "Kaza to Chandratal", description: "Cross Kunzum Pass. Camp at the Moon Lake.", elevation: 4300, distance: 80 },
          { day: 9, title: "Chandratal to Manali", description: "Gravel roads through Rohtang. Descent into Kullu Valley.", elevation: 2050, distance: 110 },
          { day: 10, title: "Departure", description: "Farewell and departure from Manali.", elevation: 2050, distance: 0 },
        ],
      },
      {
        slug: "rajasthan-desert-run",
        title: "RAJASTHAN DESERT RUN",
        subtitle: "Jaipur to Jaisalmer - The Golden Trail",
        description:
          "A sun-scorched, sand-blasted expedition through the Thar Desert. Ride past ornate havelis, massive forts, and endless dunes. This is not altitude; this is heat, grit, and the raw beauty of Rajasthan.",
        difficulty: "MODERATE",
        duration: 8,
        terrain: "DESERT",
        price: 32000,
        maxGroupSize: 14,
        nextDeparture: "2026-10-15",
        image: "https://images.unsplash.com/photo-1697464026024-046547ebd141?w=800&q=80",
        elevation: { min: 210, max: 580 },
        shadowFleet: [
          "Backup motorcycle",
          "Chase SUV with water supply",
          "First-aid kit",
          "GPS tracker per rider",
        ],
        itinerary: [
          { day: 1, title: "Jaipur Assembly", description: "Pink City tour. Bike allocation and briefing.", elevation: 430, distance: 0 },
          { day: 2, title: "Jaipur to Pushkar", description: "Ride to the holy lake city. Visit Brahma Temple.", elevation: 510, distance: 150 },
          { day: 3, title: "Pushkar to Jodhpur", description: "Enter the Blue City. Explore Mehrangarh Fort.", elevation: 231, distance: 185 },
          { day: 4, title: "Jodhpur to Jaisalmer", description: "Deep into the Thar. Golden City awaits.", elevation: 225, distance: 285 },
          { day: 5, title: "Jaisalmer Dunes", description: "Sam Sand Dunes ride. Sunset in the desert.", elevation: 210, distance: 45 },
          { day: 6, title: "Jaisalmer to Bikaner", description: "Cross the desert. Junagarh Fort visit.", elevation: 242, distance: 330 },
          { day: 7, title: "Bikaner to Jaipur", description: "Return ride. Victory dinner.", elevation: 430, distance: 330 },
          { day: 8, title: "Departure", description: "Farewell breakfast and departure.", elevation: 430, distance: 0 },
        ],
      },
      {
        slug: "meghalaya-expedition",
        title: "MEGHALAYA EXPEDITION",
        subtitle: "The Abode of Clouds - Northeast Frontier",
        description:
          "Venture into India's wettest region. Ride through living root bridges, waterfalls that cascade off cloud-wrapped cliffs, and roads carved through the densest jungles. Requires Inner Line Permits and nerves of steel.",
        difficulty: "HARD",
        duration: 9,
        terrain: "JUNGLE",
        price: 40000,
        maxGroupSize: 8,
        nextDeparture: "2026-09-01",
        image: "https://images.unsplash.com/photo-1717920961672-a701efb8896e?w=800&q=80",
        elevation: { min: 30, max: 1960 },
        shadowFleet: [
          "Backup Xpulse 200",
          "Chase vehicle",
          "Waterproof gear for every rider",
          "Satellite phone",
          "First-aid kit",
        ],
        itinerary: [
          { day: 1, title: "Guwahati Assembly", description: "Team briefing. Northeast orientation.", elevation: 55, distance: 0 },
          { day: 2, title: "Guwahati to Shillong", description: "Enter Meghalaya. Ride to the capital.", elevation: 1496, distance: 100 },
          { day: 3, title: "Shillong to Cherrapunji", description: "Wettest place on Earth. Nohkalikai Falls.", elevation: 1484, distance: 55 },
          { day: 4, title: "Cherrapunji Trek Day", description: "Trek to living root bridges. Rest day for bikes.", elevation: 1484, distance: 0 },
          { day: 5, title: "Cherrapunji to Dawki", description: "Crystal clear Umngot River. Bangladesh border.", elevation: 80, distance: 95 },
          { day: 6, title: "Dawki to Tura", description: "Cross the Garo Hills. Dense jungle riding.", elevation: 340, distance: 280 },
          { day: 7, title: "Tura to Balpakram", description: "Explore the Land of Spirits. Canyon riding.", elevation: 900, distance: 60 },
          { day: 8, title: "Balpakram to Guwahati", description: "Return ride through tribal country.", elevation: 55, distance: 320 },
          { day: 9, title: "Departure", description: "Certificate ceremony. Departure.", elevation: 55, distance: 0 },
        ],
      },
      {
        slug: "winter-zanskar",
        title: "WINTER ZANSKAR",
        subtitle: "The Frozen Highway - Chadar Trek Route",
        description:
          "The most extreme expedition we offer. Ride to the edge of the frozen Zanskar River in winter. Sub-zero temperatures, ice-covered roads, and landscapes so stark they feel extraterrestrial. Not for the faint-hearted.",
        difficulty: "EXTREME",
        duration: 14,
        terrain: "ICE",
        price: 55000,
        maxGroupSize: 6,
        nextDeparture: "2027-01-15",
        image: "https://images.unsplash.com/photo-1767973741492-338cd1e8a740?w=800&q=80",
        elevation: { min: 3000, max: 5300 },
        shadowFleet: [
          "Backup heated-grip motorcycle",
          "Chase vehicle with heater",
          "Satellite phone",
          "Cold-weather survival kit",
          "Portable oxygen concentrator",
          "Emergency evacuation helicopter on standby",
        ],
        itinerary: [
          { day: 1, title: "Leh Winter Arrival", description: "Fly in. Cold acclimatization begins.", elevation: 3500, distance: 0 },
          { day: 2, title: "Acclimatization Day 1", description: "Short rides around Leh. Gear testing in sub-zero.", elevation: 3500, distance: 30 },
          { day: 3, title: "Acclimatization Day 2", description: "Advanced cold-weather riding drills.", elevation: 3500, distance: 40 },
          { day: 4, title: "Leh to Nimmu", description: "First expedition day. Ride along frozen Zanskar.", elevation: 3100, distance: 35 },
          { day: 5, title: "Nimmu to Chilling", description: "Ice road approach. River crossing preparations.", elevation: 3050, distance: 60 },
          { day: 6, title: "Chilling Basecamp", description: "Set up advanced camp. Ice reconnaissance.", elevation: 3000, distance: 10 },
          { day: 7, title: "Frozen River Ride", description: "Ride sections of the frozen Zanskar. Extreme caution.", elevation: 3050, distance: 25 },
          { day: 8, title: "Rest & Recovery", description: "Maintenance day. Local village visit.", elevation: 3050, distance: 0 },
          { day: 9, title: "Return to Leh", description: "Ride back through frozen landscape.", elevation: 3500, distance: 95 },
          { day: 10, title: "Leh to Khardung La", description: "Winter summit attempt. Extreme cold and wind.", elevation: 5359, distance: 40 },
          { day: 11, title: "Nubra Winter", description: "Nubra Valley in winter. Surreal silence.", elevation: 3048, distance: 80 },
          { day: 12, title: "Nubra to Leh", description: "Return over Khardung La.", elevation: 3500, distance: 120 },
          { day: 13, title: "Leh Celebration", description: "Victory celebrations. Hot springs visit.", elevation: 3500, distance: 30 },
          { day: 14, title: "Departure", description: "Farewell. Fly out of Leh.", elevation: 3500, distance: 0 },
        ],
      },
    ];

    for (const tour of tours) {
      await kv.set(`tour:${tour.slug}`, tour);
    }
    await kv.set(
      "tours_list",
      tours.map((t) => t.slug)
    );

    // Seed fleet advisory
    const fleetItems = [
      {
        id: "himalayan-450",
        category: "bike",
        name: "Royal Enfield Himalayan 450",
        image: "https://images.unsplash.com/photo-1753121019457-556cc9e0f299?w=600&q=80",
        description: "The definitive adventure touring motorcycle for India. Liquid-cooled, fuel-injected, and built for punishment.",
        terrain: ["HIGH-ALTITUDE", "MOUNTAIN", "ALL-TERRAIN"],
        pros: ["Excellent ground clearance (200mm)", "Robust & easy to repair anywhere", "Comfortable for long distances", "Good low-end torque"],
        cons: ["Heavy for tight off-road trails", "Vibrations at high RPM", "Limited top speed"],
      },
      {
        id: "xpulse-200",
        category: "bike",
        name: "Hero Xpulse 200 4V",
        image: "https://images.unsplash.com/photo-1730793415965-4856f826a599?w=600&q=80",
        description: "The lightweight trail weapon. Perfect for jungle trails and narrow mountain paths where the Himalayan feels too heavy.",
        terrain: ["JUNGLE", "TRAIL", "MOUNTAIN"],
        pros: ["Extremely lightweight (154kg)", "Great off-road capability", "Affordable maintenance", "Nimble handling"],
        cons: ["Less highway comfort", "Smaller fuel tank", "Less suited for very long distances"],
      },
      {
        id: "ktm-390",
        category: "bike",
        name: "KTM 390 Adventure",
        image: "https://images.unsplash.com/photo-1586731352158-3e5a69ca56c2?w=600&q=80",
        description: "European engineering meets Indian terrain. Best for experienced riders who want performance on both tarmac and trails.",
        terrain: ["MOUNTAIN", "MIXED-TERRAIN", "HIGHWAY"],
        pros: ["Powerful 373cc engine", "Excellent electronics (TC, ABS modes)", "Premium suspension", "Great road manners"],
        cons: ["Expensive service network", "Heat management in traffic", "Requires premium fuel"],
      },
      {
        id: "helmet-guide",
        category: "gear",
        name: "Helmet Selection Guide",
        description: "Your helmet is non-negotiable. Full-face, ECE/ISI certified, with a clear and tinted visor. We recommend dual-sport helmets with peak visors for versatility. Budget: INR 5,000 - 15,000.",
        essentials: ["Full-face dual-sport helmet (ECE certified)", "Clear visor + tinted visor", "Anti-fog pinlock insert", "Chin curtain for dust protection"],
      },
      {
        id: "riding-jacket",
        category: "gear",
        name: "Riding Jacket & Armor",
        description: "CE Level 2 armor on shoulders, elbows, and back is mandatory. Choose a textile jacket with waterproof liner for mountains, mesh for desert runs.",
        essentials: ["CE Level 2 armor (shoulders, elbows, back)", "Waterproof textile jacket", "Hi-viz rain shell", "Neck gaiter/balaclava"],
      },
      {
        id: "hydration-pack",
        category: "gear",
        name: "Hydration & Nutrition",
        description: "Dehydration at altitude kills. Carry a 3L hydration pack inside your riding jacket or a tank bag. Electrolyte sachets are mandatory above 3,500m.",
        essentials: ["3L hydration bladder", "Electrolyte sachets (ORS)", "High-calorie energy bars", "Thermos for hot water"],
      },
      {
        id: "altitude-prep",
        category: "advisory",
        name: "High-Altitude Preparation",
        description: "Above 3,500m, your body is the weakest link, not the bike. Start Diamox (Acetazolamide) 2 days before ascent (consult your doctor). Never rush acclimatization.",
        tips: [
          "Consult a doctor about Diamox before the trip",
          "Hydrate aggressively - 4L/day minimum",
          "Ascend no more than 500m per day above 3,000m",
          "Recognize AMS symptoms: headache, nausea, dizziness",
          "Descend immediately if symptoms worsen",
          "Carry portable oxygen above 4,500m",
        ],
      },
    ];

    for (const item of fleetItems) {
      await kv.set(`fleet:${item.id}`, item);
    }
    await kv.set(
      "fleet_list",
      fleetItems.map((i) => i.id)
    );

    // Seed map points
    const mapPoints = [
      { id: "mech-1", type: "mechanic", name: "Rinchen Motor Works", lat: 34.1526, lng: 77.5771, city: "Leh", phone: "+91-9876543001", description: "RE specialist. Open 8AM-8PM. Stock of Himalayan parts." },
      { id: "mech-2", type: "mechanic", name: "Tanglang La Roadside Repair", lat: 32.5289, lng: 77.7849, city: "Tanglang La", phone: "+91-9876543002", description: "Emergency repairs only. Seasonal (Jun-Sep)." },
      { id: "mech-3", type: "mechanic", name: "Spiti Motor Garage", lat: 32.5936, lng: 78.0717, city: "Kaza", phone: "+91-9876543003", description: "Multi-brand mechanic. Welding available." },
      { id: "fuel-1", type: "fuel", name: "Indian Oil - Leh", lat: 34.1685, lng: 77.5856, city: "Leh", description: "Main fuel station. Petrol & Diesel. Open 6AM-10PM." },
      { id: "fuel-2", type: "fuel", name: "HP Fuel - Karu", lat: 34.0513, lng: 77.7987, city: "Karu", description: "Last fuel before Pangong. Fill up here." },
      { id: "fuel-3", type: "fuel", name: "BPCL - Tandi", lat: 32.5513, lng: 76.9987, city: "Tandi", description: "First fuel in Lahaul. Can run dry on busy weekends." },
      { id: "fuel-4", type: "fuel", name: "Indian Oil - Kaza", lat: 32.5950, lng: 78.0720, city: "Kaza", description: "Only fuel station in Spiti Valley. Rationed sometimes." },
      { id: "stay-1", type: "stay", name: "The Grand Dragon", lat: 34.1650, lng: 77.5800, city: "Leh", description: "Premium biker-friendly hotel. Heated rooms, parking, gear drying room." },
      { id: "stay-2", type: "stay", name: "Padma Homestay", lat: 34.2770, lng: 77.6020, city: "Nubra", description: "Traditional homestay. Hot meals, warm beds. Bike parking." },
      { id: "stay-3", type: "stay", name: "Zostel Spiti", lat: 32.5920, lng: 78.0700, city: "Kaza", description: "Budget-friendly hostel. Common room, bike tools available." },
      { id: "stay-4", type: "stay", name: "Camp Pangong", lat: 33.7580, lng: 78.6650, city: "Pangong", description: "Luxury camp by the lake. Heated tents. Seasonal." },
      { id: "mech-4", type: "mechanic", name: "Jodhpur Bike Garage", lat: 26.2389, lng: 73.0243, city: "Jodhpur", description: "All-brand motorcycle service. Desert riding prep specialist." },
      { id: "fuel-5", type: "fuel", name: "HP Fuel - Jaisalmer", lat: 26.9157, lng: 70.9083, city: "Jaisalmer", description: "Fill up before desert dunes. 24/7 operation." },
      { id: "stay-5", type: "stay", name: "Desert Haveli", lat: 26.9124, lng: 70.9120, city: "Jaisalmer", description: "Heritage stay with courtyard parking. Mechanic on call." },
    ];

    for (const point of mapPoints) {
      await kv.set(`map_point:${point.id}`, point);
    }
    await kv.set(
      "map_points_list",
      mapPoints.map((p) => p.id)
    );

    await kv.set("tours_seeded_v2", true);

    return c.json({ message: "Seed complete", tours: tours.length, fleet: fleetItems.length, mapPoints: mapPoints.length });
  } catch (err) {
    console.log("Seed error:", err);
    return c.json({ error: `Seeding failed: ${err}` }, 500);
  }
});

// ============ TOURS ============
app.get("/make-server-0896aea8/tours", async (c) => {
  try {
    const slugs = await kv.get("tours_list");
    if (!slugs || !Array.isArray(slugs)) {
      return c.json({ tours: [] });
    }
    const keys = slugs.map((s: string) => `tour:${s}`);
    const tours = await kv.mget(keys);
    return c.json({ tours });
  } catch (err) {
    console.log("Error fetching tours:", err);
    return c.json({ error: `Failed to fetch tours: ${err}` }, 500);
  }
});

app.get("/make-server-0896aea8/tours/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const tour = await kv.get(`tour:${slug}`);
    if (!tour) {
      return c.json({ error: "Tour not found" }, 404);
    }
    return c.json({ tour });
  } catch (err) {
    console.log("Error fetching tour:", err);
    return c.json({ error: `Failed to fetch tour: ${err}` }, 500);
  }
});

app.post("/make-server-0896aea8/tours", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const tour = await c.req.json();
    await kv.set(`tour:${tour.slug}`, tour);

    const slugs = (await kv.get("tours_list")) || [];
    if (!slugs.includes(tour.slug)) {
      slugs.push(tour.slug);
      await kv.set("tours_list", slugs);
    }

    return c.json({ message: "Tour saved", tour });
  } catch (err) {
    console.log("Error saving tour:", err);
    return c.json({ error: `Failed to save tour: ${err}` }, 500);
  }
});

app.delete("/make-server-0896aea8/tours/:slug", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const slug = c.req.param("slug");
    await kv.del(`tour:${slug}`);

    const slugs = (await kv.get("tours_list")) || [];
    const updated = slugs.filter((s: string) => s !== slug);
    await kv.set("tours_list", updated);

    return c.json({ message: "Tour deleted" });
  } catch (err) {
    console.log("Error deleting tour:", err);
    return c.json({ error: `Failed to delete tour: ${err}` }, 500);
  }
});

// ============ FLEET ============
app.get("/make-server-0896aea8/fleet", async (c) => {
  try {
    const ids = await kv.get("fleet_list");
    if (!ids || !Array.isArray(ids)) {
      return c.json({ items: [] });
    }
    const keys = ids.map((id: string) => `fleet:${id}`);
    const items = await kv.mget(keys);
    return c.json({ items });
  } catch (err) {
    console.log("Error fetching fleet:", err);
    return c.json({ error: `Failed to fetch fleet: ${err}` }, 500);
  }
});

app.post("/make-server-0896aea8/fleet", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const item = await c.req.json();
    await kv.set(`fleet:${item.id}`, item);

    const ids = (await kv.get("fleet_list")) || [];
    if (!ids.includes(item.id)) {
      ids.push(item.id);
      await kv.set("fleet_list", ids);
    }

    return c.json({ message: "Fleet item saved" });
  } catch (err) {
    console.log("Error saving fleet item:", err);
    return c.json({ error: `Failed to save fleet item: ${err}` }, 500);
  }
});

app.delete("/make-server-0896aea8/fleet/:id", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(`fleet:${id}`);

    const ids = (await kv.get("fleet_list")) || [];
    const updated = ids.filter((i: string) => i !== id);
    await kv.set("fleet_list", updated);

    return c.json({ message: "Fleet item deleted" });
  } catch (err) {
    console.log("Error deleting fleet item:", err);
    return c.json({ error: `Failed to delete fleet item: ${err}` }, 500);
  }
});

// ============ MAP POINTS ============
app.get("/make-server-0896aea8/map-points", async (c) => {
  try {
    const ids = await kv.get("map_points_list");
    if (!ids || !Array.isArray(ids)) {
      return c.json({ points: [] });
    }
    const keys = ids.map((id: string) => `map_point:${id}`);
    const points = await kv.mget(keys);
    return c.json({ points });
  } catch (err) {
    console.log("Error fetching map points:", err);
    return c.json({ error: `Failed to fetch map points: ${err}` }, 500);
  }
});

app.post("/make-server-0896aea8/map-points", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const point = await c.req.json();
    await kv.set(`map_point:${point.id}`, point);

    const ids = (await kv.get("map_points_list")) || [];
    if (!ids.includes(point.id)) {
      ids.push(point.id);
      await kv.set("map_points_list", ids);
    }

    return c.json({ message: "Map point saved" });
  } catch (err) {
    console.log("Error saving map point:", err);
    return c.json({ error: `Failed to save map point: ${err}` }, 500);
  }
});

app.delete("/make-server-0896aea8/map-points/:id", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(`map_point:${id}`);

    const ids = (await kv.get("map_points_list")) || [];
    const updated = ids.filter((i: string) => i !== id);
    await kv.set("map_points_list", updated);

    return c.json({ message: "Map point deleted" });
  } catch (err) {
    console.log("Error deleting map point:", err);
    return c.json({ error: `Failed to delete map point: ${err}` }, 500);
  }
});

// ============ PERMITS ============
app.get("/make-server-0896aea8/permits", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const permits = await kv.getByPrefix("permit:");
    return c.json({ permits });
  } catch (err) {
    console.log("Error fetching permits:", err);
    return c.json({ error: `Failed to fetch permits: ${err}` }, 500);
  }
});

app.post("/make-server-0896aea8/permits", async (c) => {
  try {
    const permit = await c.req.json();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const permitData = {
      id,
      ...permit,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };
    await kv.set(`permit:${id}`, permitData);
    return c.json({ message: "Permit submitted", permit: permitData });
  } catch (err) {
    console.log("Error submitting permit:", err);
    return c.json({ error: `Failed to submit permit: ${err}` }, 500);
  }
});

app.put("/make-server-0896aea8/permits/:id", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`permit:${id}`);
    if (!existing) {
      return c.json({ error: "Permit not found" }, 404);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(`permit:${id}`, updated);
    return c.json({ message: "Permit updated", permit: updated });
  } catch (err) {
    console.log("Error updating permit:", err);
    return c.json({ error: `Failed to update permit: ${err}` }, 500);
  }
});

// ============ PERMIT: status lookup by email (public) ============
app.get("/make-server-0896aea8/permits/by-email", async (c) => {
  try {
    const email = c.req.query("email");
    if (!email) return c.json({ error: "Email query param required" }, 400);

    const allPermits = await kv.getByPrefix("permit:");
    const userPermits = allPermits
      .filter((p: any) => p.email?.toLowerCase() === email.toLowerCase())
      .map((p: any) => ({
        id: p.id,
        destination: p.destination,
        status: p.status,
        submittedAt: p.submittedAt,
        updatedAt: p.updatedAt ?? null,
      }));

    return c.json({ permits: userPermits });
  } catch (err) {
    console.log("Error fetching permits by email:", err);
    return c.json({ error: `Failed to fetch permits: ${err}` }, 500);
  }
});

// ============ PERMIT: signed document URL (admin only) ============
app.get("/make-server-0896aea8/permits/:id/document", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    if (!admin) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const permit = await kv.get(`permit:${id}`);
    if (!permit) return c.json({ error: "Permit not found" }, 404);
    if (!permit.documentPath) return c.json({ error: "No document attached to this permit" }, 404);

    const sb = supabase();
    const { data, error } = await sb.storage
      .from("make-0896aea8-permits")
      .createSignedUrl(permit.documentPath, 3600); // 1-hour URL

    if (error) {
      console.error("Error creating signed URL:", error);
      return c.json({ error: `Failed to generate document URL: ${error.message}` }, 500);
    }

    return c.json({ url: data.signedUrl, path: permit.documentPath });
  } catch (err) {
    console.log("Error getting permit document:", err);
    return c.json({ error: `Failed to get document: ${err}` }, 500);
  }
});

// ============ AUTH ============
app.post("/make-server-0896aea8/signup", async (c) => {
  try {
    const sb = supabase();
    const { email, password, name } = await c.req.json();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });
    if (error) {
      // If the user already exists, return a friendly 200 so the setup flow
      // can continue to the sign-in step without throwing.
      const msg = error.message ?? "";
      if (msg.toLowerCase().includes("already")) {
        return c.json({ message: "User already exists", alreadyExists: true });
      }
      return c.json({ error: `Signup error: ${error.message}` }, 400);
    }
    return c.json({ message: "User created", user: data.user });
  } catch (err) {
    console.log("Signup error:", err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

app.post("/make-server-0896aea8/make-admin", async (c) => {
  try {
    const admin = await verifyAdmin(c.req.header("X-User-Token"));
    // Allow first admin setup or existing admin
    const adminList = await kv.getByPrefix("admin:");
    if (adminList.length > 0 && !admin) {
      return c.json({ error: "Unauthorized - only existing admins can create new admins" }, 401);
    }

    const { userId } = await c.req.json();
    await kv.set(`admin:${userId}`, { isAdmin: true, grantedAt: new Date().toISOString() });
    return c.json({ message: "Admin privileges granted" });
  } catch (err) {
    console.log("Make admin error:", err);
    return c.json({ error: `Failed to grant admin: ${err}` }, 500);
  }
});

app.get("/make-server-0896aea8/check-admin", async (c) => {
  try {
    const userToken = c.req.header("X-User-Token");
    if (!userToken) return c.json({ isAdmin: false });
    const sb = supabase();
    const { data: { user }, error } = await sb.auth.getUser(userToken);
    if (error || !user) return c.json({ isAdmin: false });
    const adminFlag = await kv.get(`admin:${user.id}`);
    return c.json({ isAdmin: !!adminFlag, user: { id: user.id, email: user.email, name: user.user_metadata?.name } });
  } catch (err) {
    console.log("Check admin error:", err);
    return c.json({ isAdmin: false });
  }
});

Deno.serve(app.fetch);