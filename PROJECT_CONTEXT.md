# KaamSetu — Project Context

> Auto-generated reference for AI assistants. Covers all API routes, models, lib utilities, auth utilities, and a component catalogue. No frontend page files included.

---

## Table of Contents

1. [API Routes](#api-routes)
2. [Models](#models)
3. [lib/db](#libdb)
4. [lib/middleware](#libmiddleware)
5. [lib/utils](#libutils)
6. [lib/auth](#libauth)
7. [Components](#components)

---

## API Routes

### `POST /api/auth/send-otp`
**File:** `app/api/auth/send-otp/route.js`

Sends an OTP to a mobile number. Validates 10-digit format. Rate-limited to 3 requests/hr per mobile. Deletes any existing OTP docs for the number, creates a new OTP with 10-min expiry. OTP is hardcoded `123456` for testing — MSG91 integration is a TODO.

```js
import { connectDB } from "@/lib/db/mongoose";
import OTP from "@/lib/models/OTP";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(3, 60 * 60 * 1000); // 3 per hour per mobile

// TODO: Before going live, integrate real MSG91 SendOTP API here
export async function POST(request) {
  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return error("Valid 10-digit mobile number is required");
    }

    const { allowed, retryAfter } = limiter(mobile);
    if (!allowed) {
      return error(`Too many OTP requests. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    await OTP.deleteMany({ mobile });

    const otp = "123456"; // TODO: replace with real OTP + MSG91 before going live
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await OTP.create({ mobile, otp, expiresAt });

    console.log(`TEST OTP: ${otp} for mobile ${mobile}`);

    return ok({ message: "OTP sent successfully" });
  } catch (err) {
    logger.error("send-otp error", { err: err.message });
    return error("Server error", 500);
  }
}
```

---

### `POST /api/auth/verify-otp`
**File:** `app/api/auth/verify-otp/route.js`

Verifies an OTP against the MongoDB record. Rate-limited to 5 per 15 min per mobile. Checks expiry, increments attempt counter, marks `verified: true` on success. Returns a session JWT for existing users; for new users in `mode: "signup"`, returns a proof token (no session yet — signup flow takes over). Blocks users with `status: "blocked"`.

```js
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import OTP from "@/lib/models/OTP";
import { signToken } from "@/lib/utils/jwt";
import { ok, error } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(5, 15 * 60 * 1000); // 5 per 15 min per mobile

export async function POST(request) {
  try {
    const { mobile, otp, mode = "login" } = await request.json();

    if (!mobile || !otp) return error("mobile and otp are required");

    const { allowed, retryAfter } = limiter(mobile);
    if (!allowed) {
      return error(`Too many attempts. Try again in ${retryAfter}s`, 429);
    }

    await connectDB();

    const record = await OTP.findOne({ mobile }).sort({ createdAt: -1 });
    if (!record || record.verified) {
      return error("OTP expired or already used / OTP expire हो गया", 400);
    }
    if (new Date() > record.expiresAt) {
      return error("OTP expired / OTP expire हो गया", 400);
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      await record.save();
      return error("Too many attempts / बहुत अधिक प्रयास", 429);
    }

    if (record.otp !== otp) {
      await record.save();
      return error("Invalid OTP / गलत OTP", 400);
    }

    record.verified = true;
    await record.save();

    const user = await User.findOne({ mobile });

    if (!user) {
      if (mode === "signup") {
        const token = signToken({ mobile });
        return ok({ token, mobile, isNewUser: true });
      }
      return error(
        "Account not found. Please sign up first / Account नहीं मिला। पहले sign up करें",
        404
      );
    }

    if (user.status === "blocked") {
      return error("आपका account block है / Your account has been blocked", 403);
    }

    const token = signToken({ id: user._id, mobile: user.mobile, role: user.role });

    return ok({
      token,
      mobile: user.mobile,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser: false,
    });
  } catch (err) {
    logger.error("verify-otp error", { err: err.message });
    return error("Server error", 500);
  }
}
```

---

### `POST /api/auth/verify-otp-widget`
**File:** `app/api/auth/verify-otp-widget/route.js`

Deprecated/tombstone. Returns 410 Gone. Clients should use `/api/auth/verify-otp` instead.

```js
import { NextResponse } from "next/server";

// This route is no longer used — OTP widget replaced with simple test OTP system
export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use /api/auth/verify-otp instead" },
    { status: 410 }
  );
}
```

---

### `POST /api/auth/signup/worker`
**File:** `app/api/auth/signup/worker/route.js`

Registers a new worker. Requires OTP proof token. Accepts optional GPS coordinates (`lat`/`lng`) to store as GeoJSON. If worker with same mobile exists and is `pending`/`rejected`, updates the record; if `approved`/`blocked`, returns 400. On success creates `User` + `Worker` docs atomically (rolls back User if Worker creation fails). Returns JWT with `role: "worker"`.

```js
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Worker from "@/lib/models/Worker";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function POST(request) {
  try {
    const body = await request.json();

    const { mobile, name, category, subcategory, gender, experience, serviceType, city, area, token } = body;
    const location = {
      city: city || "",
      address: area || "",
      ...(body.lat && body.lng ? {
        coordinates: {
          type: "Point",
          coordinates: [parseFloat(body.lng), parseFloat(body.lat)],
        },
      } : {}),
    };

    if (!mobile || !name) {
      return error("mobile and name are required");
    }

    if (!token) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    const existingWorker = await Worker.findOne({ mobile });
    if (existingWorker) {
      if (existingWorker.status === "approved" || existingWorker.status === "blocked") {
        return error("Mobile number already registered", 400);
      }
      await Worker.findByIdAndUpdate(existingWorker._id, {
        name,
        category: category || "",
        subcategory: subcategory || "",
        gender,
        experience: parseInt(experience) || 0,
        serviceType: serviceType || "both",
        location,
      });
      const updatedToken = signToken({ id: existingWorker.user, mobile, role: "worker" });
      return ok({
        message: "Registration updated successfully",
        token: updatedToken,
        worker: { id: existingWorker._id, name, status: existingWorker.status },
      });
    }

    const user = await User.create({ mobile, name, role: "worker" });

    let worker;
    try {
      worker = await Worker.create({
        user: user._id,
        mobile,
        name,
        category: category || "",
        subcategory: subcategory || "",
        gender,
        experience: parseInt(experience) || 0,
        serviceType: serviceType || "both",
        location,
        status: "pending",
      });
    } catch (createError) {
      logger.error("Worker create failed", { msg: createError.message, code: createError.code });
      await User.findByIdAndDelete(user._id);
      return error("Worker registration failed. Please try again.", 500);
    }

    const newToken = signToken({ id: user._id, mobile, role: "worker" });

    return created({
      message: "Worker registered. Pending admin approval.",
      token: newToken,
      worker: { id: worker._id, name, status: "pending" },
    });
  } catch (err) {
    logger.error("[WORKER_SIGNUP] error", { msg: err.message, code: err.code });

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return error(`${field} already registered / पहले से registered है`, 409);
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message).join(", ");
      return error(`Validation failed: ${messages}`, 400);
    }

    return error("Server error", 500);
  }
}
```

---

### `POST /api/auth/signup/client`
**File:** `app/api/auth/signup/client/route.js`

Registers a new client. Requires OTP proof token. Upserts User (creates or updates name), upserts Client doc. Returns JWT with `role: "client"`.

```js
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Client from "@/lib/models/Client";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, name, city, area, location, otpToken, token: otpProofToken } = body;
    const verifyTokenStr = otpToken || otpProofToken;

    if (!mobile || !name) return error("mobile and name are required");

    if (!verifyTokenStr) return error("OTP verification required before signup");
    const tokenPayload = verifyToken(verifyTokenStr);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    let user = await User.findOne({ mobile });
    if (user && user.role !== "client") return error("Mobile already registered with a different role");

    if (!user) {
      user = await User.create({ mobile, name, role: "client" });
    } else {
      user.name = name;
      await user.save();
    }

    let client = await Client.findOne({ user: user._id });
    if (!client) {
      client = await Client.create({
        user: user._id,
        mobile,
        name,
        location: location || { city: city || "", address: area || "" },
      });
    }

    const authToken = signToken({ id: user._id, mobile, role: "client" });

    return created({
      message: "Client registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name, role: "client" },
    });
  } catch (err) {
    logger.error("client signup error", { err: err.message });
    return error("Server error", 500);
  }
}
```

---

### `POST /api/auth/signup/shop`
**File:** `app/api/auth/signup/shop/route.js`

Registers a new shop owner. Requires OTP proof token and category. Upserts User + Shop. Returns JWT with `role: "shop"`.

```js
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/models/User";
import Shop from "@/lib/models/Shop";
import { signToken, verifyToken } from "@/lib/utils/jwt";
import { ok, error, created } from "@/lib/utils/apiResponse";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, ownerName, shopName, city, area, category, description, token } = body;

    if (!mobile || !ownerName || !shopName) return error("mobile, ownerName and shopName are required");
    if (!category) return error("Category is required");
    if (!token) return error("OTP verification required before signup");

    const tokenPayload = verifyToken(token);
    if (!tokenPayload) return error("OTP verification required before signup");

    await connectDB();

    let user = await User.findOne({ mobile });
    if (user && user.role !== "shop") return error("Mobile already registered with a different role", 400);

    if (!user) {
      user = await User.create({ mobile, name: ownerName, role: "shop" });
    } else {
      user.name = ownerName;
      await user.save();
    }

    let shop = await Shop.findOne({ user: user._id });
    if (!shop) {
      shop = await Shop.create({
        user: user._id,
        mobile,
        ownerName,
        shopName,
        category,
        description: description || "",
        location: { city: city || "", address: area || "" },
      });
    }

    const authToken = signToken({ id: user._id, mobile, role: "shop" });

    return created({
      message: "Shop registered successfully.",
      token: authToken,
      user: { id: user._id, mobile, name: ownerName, role: "shop" },
    });
  } catch (err) {
    console.error("shop signup error:", err);
    return error("Server error", 500);
  }
}
```

---

### `POST /api/auth/admin` (deprecated)
**File:** `app/api/auth/admin/route.js`

Tombstone. Returns 410 Gone. Use `/api/admin/auth/login` instead.

---

### `POST /api/admin/auth/login`
**File:** `app/api/admin/auth/login/route.js`

Admin login. Rate-limited 10 per 15 min per IP. Credentials validated against `ADMIN_USERNAME` + `ADMIN_SECRET_PASSWORD` env vars. Returns JWT with `role: "admin"`, expiry 8h.

```js
import { signToken } from "@/lib/utils/jwt";
import { ok, error, unauthorized } from "@/lib/utils/apiResponse";
import { createRateLimit } from "@/lib/middleware/rateLimit";
import { logger } from "@/lib/utils/logger";

const limiter = createRateLimit(10, 15 * 60 * 1000); // 10 per 15 min per IP

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed, retryAfter } = limiter(ip);
    if (!allowed) {
      return error(`Too many login attempts. Try again in ${retryAfter}s`, 429);
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return error("Username and password required");
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (username !== validUsername || password !== validPassword) {
      return unauthorized("Invalid username or password");
    }

    const token = signToken({ id: "admin", username, role: "admin" }, "8h");

    return ok({ token, admin: { username, role: "admin" } });
  } catch (err) {
    logger.error("Admin login error", { err: err.message });
    return error("Server error", 500);
  }
}
```

---

### `GET /api/admin/stats`
**File:** `app/api/admin/stats/route.js`

Admin-only. Returns platform-wide counts: total/active/pending workers, total clients, today's jobs, working/free workers, total subscription earnings.

---

### `GET /api/admin/analytics`
**File:** `app/api/admin/analytics/route.js`

Admin-only. Time-series chart data for workers, clients, and jobs registered per day. `?range=7` (default) returns last N days.

---

### `GET, PATCH /api/admin/pending-requests`
**File:** `app/api/admin/pending-requests/route.js`

Admin-only. GET: lists all pending job requests (up to 50). PATCH: marks a request as `called` (sets `calledAt`) or `resolved` (sets `status: "completed"` + `resolvedAt`).

---

### `GET /api/admin/workers`
**File:** `app/api/admin/workers/route.js`

Admin-only. Paginated worker list. Query params: `?status=pending|approved|blocked|all`, `?search=<text>`, `?page=1`, `?limit=20`. Returns `{ workers, pagination: { total, page, limit, pages, hasNext, hasPrev } }`.

---

### `PATCH /api/admin/workers/[id]`
**File:** `app/api/admin/workers/[id]/route.js`

Admin-only. Actions: `approve`, `reject`, `activate`, `deactivate`, `block` (also blocks the User), `boost` (7-day boost), `extend` (add 30-day subscription).

---

### `GET /api/admin/clients`
**File:** `app/api/admin/clients/route.js`

Admin-only. Paginated client list. Same pagination shape as workers.

---

### `GET /api/admin/jobs`
**File:** `app/api/admin/jobs/route.js`

Admin-only. Paginated job requests list. Searchable by category, clientMobile, clientName. Returns full job details including PII (admin context).

---

### `GET, PATCH, DELETE /api/admin/jobs/[id]`
**File:** `app/api/admin/jobs/[id]/route.js`

Admin-only. GET: single job. PATCH: update `status` and/or `adminNotes`. DELETE: hard delete.

---

### `GET /api/workers`
**File:** `app/api/workers/route.js`

Public. Lists approved workers with filters: `?category`, `?subcategory`, `?gender`, `?serviceType`, `?sortBy=rating|newest|distance`, `?rating=<min>`, `?city`, `?query=<text>`. Returns up to 50 workers. Strips `__v`. Includes `subscriptionActive` flag.

---

### `GET, PATCH /api/workers/[id]`
**File:** `app/api/workers/[id]/route.js`

GET: public worker profile by MongoDB ID. PATCH: requires auth; workers can only update their own profile (checked via `Worker.findOne({ user: payload.id })`); admins can update any. Allowed update fields: `name`, `photo`, `bio`, `experience`, `serviceType`, `location`, `languages`.

---

### `GET /api/workers/me`
**File:** `app/api/workers/me/route.js`

Worker-only. Returns the authenticated worker's own profile.

---

### `PATCH /api/workers/status`
**File:** `app/api/workers/status/route.js`

Worker-only. Updates `workStatus` to `"free"` or `"working"`.

---

### `GET, POST /api/jobs`
**File:** `app/api/jobs/route.js`

**GET**: Worker's job feed. When `?workerId=<userId>&status=pending` is passed, returns pending jobs near the worker. If the worker has saved GPS coordinates, uses MongoDB `$geoNear` aggregation within `?radius=50` km (default) sorted by distance. Falls back to city text-match if no coordinates. For non-pending status, returns the worker's own job history. `clientMobile` and `clientName` are intentionally stripped from the public GET response.

**POST**: Client submits a job request. `clientId` is derived from auth token only (never from body). Accepts optional `lat`/`lng` to store GeoJSON coordinates. If `workerId` is in the body, validates that the worker is `approved` and has an active subscription before assigning.

```js
// GET handler (key excerpt — geospatial path)
if (workerCoords?.length === 2) {
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: workerCoords },
        distanceField: "distanceMeters",
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: {
          status: "pending",
          ...(workerProfile.category && {
            category: { $regex: workerProfile.category, $options: "i" },
          }),
        },
      },
    },
    { $sort: { distanceMeters: 1 } },
    { $limit: 50 },
  ];
  const geoJobs = await JobRequest.aggregate(pipeline);
  return ok({ jobs: geoJobs.map(j => ({ ..., distanceKm: ... })) });
}
```

---

### `POST /api/jobs/[id]/accept`
**File:** `app/api/jobs/[id]/accept/route.js`

Worker-only. Accepts a pending job. Sets `job.worker = worker._id`, `job.status = "accepted"`, `worker.workStatus = "working"`. Returns `clientMobile` and `clientName` — the only point where PII is exposed to the worker.

---

### `POST /api/jobs/[id]/reject`
**File:** `app/api/jobs/[id]/reject/route.js`

Worker-only. Rejects a job. Ownership check: if `job.worker` is set, only that assigned worker can reject. If unassigned, any authenticated worker can dismiss it from their feed. Sets `job.status = "rejected"`.

---

### `GET /api/client/requests`
**File:** `app/api/client/requests/route.js`

Authenticated. Returns all job requests for the logged-in client (matched by both `clientMobile` from token and `clientId`). Batch-fetches associated worker details (name, mobile, rating, experience) in a single query to avoid N+1.

---

### `POST /api/payments/create-order`
**File:** `app/api/payments/create-order/route.js`

Worker-only. Creates a Razorpay order for a subscription plan (`monthly` ₹199, `quarterly` ₹499, `yearly` ₹1499). If `RAZORPAY_KEY_ID` contains `test_xxxx`, skips Razorpay and returns a fake dev order.

---

### `POST /api/payments/verify`
**File:** `app/api/payments/verify/route.js`

Worker-only. Verifies Razorpay HMAC-SHA256 payment signature. If valid (or if in dev mode), activates the subscription, sets `Worker.subscriptionExpiry`, and marks `Subscription.status = "active"`.

---

### `GET, POST /api/categories/custom`
**File:** `app/api/categories/custom/route.js`

GET: admin-only, lists all custom categories. POST: authenticated users can propose new categories (status `pending`); admin proposals are auto-approved. Slug is generated from `nameEn`.

---

## Models

### `User`
**File:** `lib/models/User.js`

Central auth identity. All roles share this model.

```js
{
  mobile: String,     // unique, required
  name: String,
  role: String,       // enum: worker | client | admin | shop
  status: String,     // enum: active | blocked, default: active
  profileComplete: Boolean,
}
```

---

### `Worker`
**File:** `lib/models/Worker.js`

Worker profile linked to a User. Has GeoJSON coordinates for geospatial matching.

```js
{
  user: ObjectId(User),
  mobile: String,           // unique
  name: String,
  photo: String,
  category: String,
  subcategory: String,
  gender: String,           // male | female | other
  experience: Number,
  serviceType: String,      // home_visit | shop_office | both
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ["Point"] },
      coordinates: [Number],  // [lng, lat]
    },
  },
  status: String,           // pending | approved | rejected | blocked | deactivated
  workStatus: String,       // free | working
  rating: Number,           // 0-5
  totalRatings: Number,
  totalJobs: Number,
  subscriptionExpiry: Date,
  boosted: Boolean,
  boostedUntil: Date,
  bio: String,
  languages: [String],
}

// Indexes:
workerSchema.index({ status: 1, workStatus: 1 });
workerSchema.index({ category: 1 });
workerSchema.index({ "location.city": 1 });
workerSchema.index({ "location.coordinates": "2dsphere" });
```

---

### `Client`
**File:** `lib/models/Client.js`

Client profile linked to a User.

```js
{
  user: ObjectId(User),
  mobile: String,
  name: String,
  location: { address, city, state, pincode },
  status: String,           // active | blocked
  totalRequests: Number,
}
```

---

### `JobRequest`
**File:** `lib/models/JobRequest.js`

Service requests submitted by clients. Has GeoJSON coordinates for geospatial matching with workers.

```js
{
  client: ObjectId(Client),
  clientId: ObjectId(Client),
  clientMobile: String,     // required
  clientName: String,
  worker: ObjectId(Worker),
  category: String,
  subcategory: String,
  description: String,
  location: {
    address: String,
    city: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ["Point"] },
      coordinates: [Number],  // [lng, lat]
    },
  },
  status: String,   // pending | accepted | rejected | completed | cancelled
  source: String,   // search | category | direct | admin
  adminNotes: String,
  calledAt: Date,
  resolvedAt: Date,
}

// Indexes:
jobRequestSchema.index({ status: 1 });
jobRequestSchema.index({ worker: 1 });
jobRequestSchema.index({ createdAt: -1 });
jobRequestSchema.index({ "location.coordinates": "2dsphere" });
```

---

### `OTP`
**File:** `lib/models/OTP.js`

Stores OTP records for verification. TTL index auto-deletes expired documents.

```js
{
  mobile: String,
  otp: String,
  attempts: Number,       // incremented on wrong guess
  verified: Boolean,      // true once used
  expiresAt: Date,        // 10 min from creation
}

// TTL index: expiresAt 1, expireAfterSeconds: 0
// Index: mobile 1
```

---

### `Subscription`
**File:** `lib/models/Subscription.js`

Payment/subscription records for workers.

```js
{
  worker: ObjectId(Worker),
  plan: String,           // monthly | quarterly | yearly
  amount: Number,         // in INR (not paise)
  currency: String,       // INR
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: String,         // pending | active | expired | failed
  startDate: Date,
  endDate: Date,
}

// Index: { worker: 1, status: 1 }
```

---

### `Shop`
**File:** `lib/models/Shop.js`

Shop owner profile. Note: uses OLD flat `{ lat, lng }` coordinates — NOT yet migrated to GeoJSON 2dsphere.

```js
{
  user: ObjectId(User),
  mobile: String,
  ownerName: String,
  shopName: String,
  category: String,
  description: String,
  photo: String,
  location: {
    address, city, state, pincode,
    coordinates: { lat: Number, lng: Number },  // flat — NOT GeoJSON
  },
  status: String,   // pending | approved | rejected | blocked
  rating: Number,
  totalRatings: Number,
  openingHours: String,
  adActive: Boolean,
  adExpiry: Date,
}
```

---

### `CustomCategory`
**File:** `lib/models/CustomCategory.js`

User-proposed or admin-created service categories.

```js
{
  nameEn: String,           // required
  nameHi: String,
  slug: String,             // unique, lowercase
  parentCategory: String,
  requestedBy: ObjectId(Worker),
  status: String,           // pending | approved | rejected
  approvedBy: ObjectId(User),
}
```

---

## lib/db

### `connectDB()`
**File:** `lib/db/mongoose.js`

Cached Mongoose connection. Uses `createRequire` to force IPv4 DNS before Mongoose loads (fixes Vercel/serverless DNS issues). Connection options: `family: 4`, `serverSelectionTimeoutMS: 10000`, `socketTimeoutMS: 45000`. Throws if `MONGODB_URI` is not set.

```js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## lib/middleware

### `createRateLimit(maxRequests, windowMs)`
**File:** `lib/middleware/rateLimit.js`

In-memory sliding-window rate limiter. Returns a `check(key)` function. Resets on server restart. Used for OTP and admin login endpoints.

```js
export function createRateLimit(maxRequests, windowMs) {
  const store = new Map();
  return function check(key) {
    const now = Date.now();
    const hits = (store.get(key) || []).filter(t => now - t < windowMs);
    if (hits.length >= maxRequests) {
      return { allowed: false, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) };
    }
    hits.push(now);
    store.set(key, hits);
    return { allowed: true };
  };
}
```

**Usage:**
- `send-otp`: `createRateLimit(3, 60*60*1000)` — 3/hr per mobile
- `verify-otp`: `createRateLimit(5, 15*60*1000)` — 5/15min per mobile
- `admin/auth/login`: `createRateLimit(10, 15*60*1000)` — 10/15min per IP

---

## lib/utils

### `jwt.js`
**File:** `lib/utils/jwt.js`

JWT signing and verification. Throws at startup if `JWT_SECRET` env var is missing. Default expiry is `24h`. Admin tokens use `8h`.

```js
export function signToken(payload, expiresIn = "24h") { ... }
export function verifyToken(token) { ... }  // returns null on any error
export function getTokenFromRequest(request) { ... }  // reads Authorization: Bearer header or `token` cookie
```

---

### `apiResponse.js`
**File:** `lib/utils/apiResponse.js`

Standardised `NextResponse.json` wrappers.

```js
export function ok(data = {}, status = 200)     // { success: true, ...data }
export function created(data = {})               // ok(data, 201)
export function error(message, status = 400)     // { success: false, message }
export function unauthorized(message)            // error(message, 401)
export function forbidden(message)               // error(message, 403)
export function notFound(message)                // error(message, 404)
export function serverError(message)             // error(message, 500)
```

---

### `logger.js`
**File:** `lib/utils/logger.js`

Structured logger. In production: JSON output. In development: readable `[LEVEL] message` format.

```js
export const logger = {
  info:  (msg, meta = {}) => console.log(...),
  warn:  (msg, meta = {}) => console.warn(...),
  error: (msg, meta = {}) => console.error(...),
};
```

---

### `distance.js`
**File:** `lib/utils/distance.js`

Haversine formula for straight-line distance between two GPS points.

```js
export function getDistanceKm(lat1, lng1, lat2, lng2) → number  // rounded to 1 decimal
```

---

### `auth.js` (HOF wrappers — currently unused by routes)
**File:** `lib/utils/auth.js`

Higher-order functions for route auth. **Not currently used** — all routes inline their own auth checks.

```js
export function withAuth(handler, allowedRoles = []) { ... }
export function withAdmin(handler) { ... }
export function withWorker(handler) { ... }
export function withClient(handler) { ... }
```

---

### `adminAuth.js`
**File:** `lib/utils/adminAuth.js`

Client-side admin auth helpers (browser only).

```js
export function getAdminToken()         // reads kaamsetu_admin_token from localStorage
export function isAdminLoggedIn()       // boolean
export function adminLogout()           // clears storage, redirects to /admin/login
export function getAdminAuthHeaders()   // returns { Content-Type, Authorization }
```

---

### `validation.js`
**File:** `lib/utils/validation.js`

Form validation helpers. All error messages are bilingual (Hindi / English).

```js
export function validateName(name)                              // 2-50 chars
export function validateMobile(mobile)                          // 10 digits, starts 6-9
export function validateRequired(value, fieldName)
export function validateNumber(value, fieldName, { min, max })
export function validateForm(values, schema)                    // schema: { field: validatorFn }
```

---

### `otp.js` (legacy — unused)
**File:** `lib/utils/otp.js`

Original MSG91 direct-API OTP sender. Kept for reference only. The current OTP system uses MongoDB-stored OTPs via `/api/auth/send-otp` and `/api/auth/verify-otp`.

---

## lib/auth

### `useRoleGuard(requiredRole)`
**File:** `lib/auth/useRoleGuard.js`

Client-side React hook. On mount, reads `kaamsetu_token` and `kaamsetu_user` from localStorage. Redirects to `/auth/login` if unauthenticated; redirects to the user's own dashboard if the wrong role.

```js
// Usage in page components:
useRoleGuard("client");   // or "worker" / "shop"
```

---

### `roleGuard.js`
**File:** `lib/auth/roleGuard.js`

Server-side (non-hook) role utilities.

```js
export function getUserRole()          // reads kaamsetu_user from localStorage (client-only)
export function redirectByRole(router) // redirects to dashboard based on role
```

---

## Components

| Component | File | Description |
|---|---|---|
| `Header` | `components/Header.jsx` | Site header with logo, nav links, auth state |
| `Footer` | `components/Footer.jsx` | Site footer with links |
| `ActionCard` | `components/ActionCard.jsx` | CTA card with icon, title, description. Variants: `navy`, `orange` (maps to `bg-brand-yellow text-brand-navy`) |
| `StatCard` | `components/StatCard.jsx` | Dashboard metric card. Color variants: `blue`, `orange`, `green`, `navy`, `yellow`, `red` |
| `WorkerCard` | `components/WorkerCard.jsx` | Worker listing card with name, category, rating, location, status badge. Uses `useT()` for i18n |
| `JobNotificationCard` | `components/JobNotificationCard.jsx` | Notification card for incoming job requests shown to workers. Accept / Reject actions |
| `FilterPanel` | `components/FilterPanel.jsx` | Search/filter sidebar for worker listings. Category, subcategory, gender, serviceType, sortBy filters. Uses `useT()` for i18n |
| `CategoryCard` | `components/CategoryCard.jsx` | Category selection card with icon and bilingual label |
| `CategorySelect` | `components/CategorySelect.jsx` | Dropdown select for job categories with bilingual options |
| `OTPVerification` | `components/OTPVerification.jsx` | Full OTP flow UI: mobile input → OTP input → success. Manages send/verify API calls |
| `OTPInput` | `components/OTPInput.jsx` | 6-cell OTP digit input with auto-focus and paste support |
| `MobileInput` | `components/MobileInput.jsx` | +91 prefixed mobile number input with validation styling |
| `AdminSidebar` | `components/AdminSidebar.jsx` | Left nav sidebar for admin panel pages |
| `LoadingSkeleton` | `components/LoadingSkeleton.jsx` | Skeleton placeholder components: `WorkerCardSkeleton`, `StatCardSkeleton` |
| `EmptyState` | `components/EmptyState.jsx` | Empty state illustration with bilingual message and optional CTA |
| `Toast` | `components/Toast.jsx` | Toast notification system. `useToast()` hook returns `{ success, error, info, warn }` methods |
| `WorkerStatusBadge` | `components/WorkerStatusBadge.jsx` | Pill badge showing worker availability (`free` / `working`) |
| `RatingStars` | `components/RatingStars.jsx` | 5-star rating display component |
| `BilingualLabel` | `components/BilingualLabel.jsx` | Renders a label with both Hindi and English text side by side |
| `LocationPicker` | `components/LocationPicker.jsx` | City + area input fields with optional GPS capture |
| `HeroSearch` | `components/HeroSearch.jsx` | Homepage search bar with category and city inputs |
| `CategoriesHeading` | `components/CategoriesHeading.jsx` | Section heading for categories grid |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for signing/verifying JWTs (throws on startup if missing) |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_SECRET_PASSWORD` | Yes | Admin login password |
| `RAZORPAY_KEY_ID` | For payments | Razorpay key; if contains `test_xxxx`, enters dev mock mode |
| `RAZORPAY_KEY_SECRET` | For payments | Razorpay secret for HMAC verification |
| `MSG91_AUTH_KEY` | Future | MSG91 key for real OTP SMS (not yet wired) |
| `MSG91_TEMPLATE_ID` | Future | MSG91 OTP template |
| `MSG91_SENDER_ID` | Future | SMS sender ID (default: `KAAMSETU`) |

---

## Key Design Decisions

- **PII protection**: `clientMobile` and `clientName` are hidden from the public `GET /api/jobs` response. They are only returned by `POST /api/jobs/[id]/accept`, i.e., after a worker accepts the job.
- **GeoJSON everywhere (except Shop)**: `Worker.location.coordinates` and `JobRequest.location.coordinates` use GeoJSON Point format `[lng, lat]` with 2dsphere indexes. `Shop.location.coordinates` still uses legacy `{ lat, lng }` flat format — not yet migrated.
- **Rate limiting is in-memory**: `lib/middleware/rateLimit.js` uses a Map — limits reset on every server restart. For production multi-instance deployments this would need Redis.
- **OTP is hardcoded for testing**: `send-otp` always uses `"123456"`. Real MSG91 integration is marked TODO.
- **JWT expiry**: Worker/client tokens expire in 24h. Admin tokens expire in 8h.
- **Worker status gate**: Workers must be `approved` with an active `subscriptionExpiry` to be directly assigned a job via POST `/api/jobs`.
- **Role guard is client-side only**: `useRoleGuard` relies on localStorage — not a security boundary, just a UX redirect. All real auth happens server-side via JWT in API routes.
