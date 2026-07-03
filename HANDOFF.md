# KaamSetu — Handoff Guide

Everything the new owner needs to run this in production. The app is a Next.js
app deployed on **Vercel**, using **MongoDB Atlas**, with payments via
**Razorpay**.

> **Golden rule about secrets:** `.env.local` lives only on a developer's
> machine. It is gitignored and is **never** uploaded anywhere. Production reads
> its configuration from the **Vercel dashboard → Settings → Environment
> Variables**. Setting a value in one place does NOT set it in the other.

---

## 1. Environment variables

Set every variable below in **Vercel → Settings → Environment Variables** for the
**Production** (and ideally **Preview**) environments. For local development, put
the same values in a `.env.local` file at the project root.

### Core
| Variable | What it is |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string. **Use your own Atlas cluster.** |
| `JWT_SECRET` | A long random string for signing login tokens. Generate a fresh one. |
| `NODE_ENV` | `production` on the live site. |
| `NEXT_PUBLIC_APP_URL` | Your live URL, e.g. `https://kaamsetu.live`. |
| `NEXT_PUBLIC_SITE_URL` | Same live URL. |

### Admin login
| Variable | What it is |
|---|---|
| `ADMIN_USERNAME` | Admin panel username. **Change from the dev value.** |
| `ADMIN_SECRET_PASSWORD` | Admin panel password. **Change to a strong secret.** |
| `ADMIN_EMAIL` | Where "new job" admin notification emails go. |

### Razorpay (payments)
| Variable | What it is |
|---|---|
| `RAZORPAY_KEY_ID` | Public key id (`rzp_test_…` for testing, `rzp_live_…` for real money). |
| `RAZORPAY_KEY_SECRET` | **Server-only secret.** Never expose. Signs/verifies payments. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Same value as `RAZORPAY_KEY_ID`.** Used by the browser checkout. |
| `RAZORPAY_WEBHOOK_SECRET` | The secret Razorpay gives you when you register the webhook (see §3). |

### Email (OTP + notifications) — Gmail
| Variable | What it is |
|---|---|
| `GMAIL_USER` | The Gmail address that sends OTP + notification emails. |
| `GMAIL_APP_PASSWORD` | A Gmail **App Password** (not the account password). |

### Images — Cloudinary
| Variable | What it is |
|---|---|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Your Cloudinary account (image uploads). |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same cloud name, exposed to the browser. |

### Maps / address (Mappls / MapMyIndia)
| Variable | What it is |
|---|---|
| `MAPMYINDIA_CLIENT_ID`, `MAPMYINDIA_CLIENT_SECRET` | Mappls OAuth credentials for address search + reverse-geocode. |
| `MAPMYINDIA_REST_KEY` | Mappls REST key (if used). |

> ⚠️ **Naming note:** the code reads `MAPMYINDIA_CLIENT_ID` / `MAPMYINDIA_CLIENT_SECRET`.
> An older `.env.example` listed these as `MAPPLS_CLIENT_ID/SECRET` — use the
> `MAPMYINDIA_` names, which is what the code actually looks for.

### SMS (optional — currently email-based OTP)
| Variable | What it is |
|---|---|
| `FAST2SMS_API_KEY` | Only if you wire SMS. OTP currently goes by **email**, not SMS. |

---

## 2. Deploying a change

Vercel auto-deploys every push to the `main` branch. **Environment-variable
changes only take effect on the next deploy** — after editing vars in the
dashboard, click **Redeploy** on the latest deployment (this especially matters
for any `NEXT_PUBLIC_*` var, which is baked into the browser bundle at build
time).

---

## 3. Razorpay setup (step by step)

1. **Create/own the Razorpay account.** The keys handed over are **TEST** keys —
   generate your **own** keys in *Razorpay Dashboard → Settings → API Keys*.
2. **Add the 3 key vars** (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`) in Vercel, then redeploy.
3. **Register the webhook** (strongly recommended before taking real payments):
   *Razorpay Dashboard → Settings → Webhooks → Add New Webhook*
   - URL: `https://<your-domain>/api/payments/webhook`
   - Active event: **`payment.captured`**
   - Copy the **webhook secret** Razorpay generates → set it as
     `RAZORPAY_WEBHOOK_SECRET` in Vercel → redeploy.
   The webhook is the safety net: it activates a subscription / creates a paid ad
   even if the buyer's browser closes at the moment of payment.
4. **Test mode:** with `rzp_test_` keys, use Razorpay's test card
   `4111 1111 1111 1111`, any future expiry, any CVV — no real money moves.
5. **Go live:** replace `rzp_test_…` keys with `rzp_live_…` keys in Vercel and
   redeploy. No code changes needed.

### How payments work here
- **Worker subscription** (₹/month, admin-configurable price): worker pays →
  `subscriptionExpiry` extends → job feed unlocks.
- **Shop ads** (₹100/day): shop pays → ad is created as **pending** → admin
  reviews the creative in the admin panel → admin approves → ad goes live.
- Amounts are always computed **server-side** — the client cannot change the
  price.

---

## 4. Before going live — checklist

See also `PRODUCTION_CHECKLIST.md`. Key items:
- [ ] Rotate **all** secrets to your own accounts (Razorpay, MongoDB, JWT, admin
      password, Gmail, Cloudinary, Mappls). The dev/test values are shared and
      must not be reused in production.
- [ ] Set every variable in §1 in the Vercel dashboard, then redeploy.
- [ ] Register the Razorpay webhook (§3) and set `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Restore the Content-Security-Policy in `next.config.mjs` (currently
      disabled for testing) and whitelist `razorpay.com`.
- [ ] Point your domain at Vercel + enable HTTPS.
- [ ] Manual end-to-end test on the live site: worker signup → admin approve →
      subscription payment; shop signup → ad payment → admin approve → ad shows.

---

## 5. Admin panel

Reachable at `/admin/login`. Manages workers, shops, clients, ads, jobs,
reports, categories, offers, notifications, security, search keywords, payments,
and platform settings (including the subscription price). Log in with
`ADMIN_USERNAME` / `ADMIN_SECRET_PASSWORD`.
