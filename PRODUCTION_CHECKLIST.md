# Before Going Live Checklist

## Security
- [ ] Restore CSP headers in next.config.mjs
- [ ] Change ADMIN_USERNAME and ADMIN_PASSWORD in .env
- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production

## Third Party
- [ ] Replace MSG91 test credentials with client's account credentials
- [ ] Replace Razorpay TEST keys (rzp_test_) with LIVE keys (rzp_live_)
- [ ] Complete DLT registration for SMS
- [ ] Replace MongoDB URI with client's Atlas account

## Domain
- [ ] Point domain to hosting server
- [ ] Enable HTTPS/SSL
- [ ] Update NEXT_PUBLIC_APP_URL to real domain

## Testing
- [ ] Full end-to-end test on production server
- [ ] Test OTP on real mobile numbers
- [ ] Test payment flow in live mode
- [ ] Test on mobile devices (Android + iOS)
