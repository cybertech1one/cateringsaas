# Diyafa Multi-Audience Platform — Design Document

**Date**: 2026-02-21
**Status**: Proposed
**Branch**: feat/sprint3-customer-facing-redesign

## The Big Picture

Diyafa is not just a menu builder. It's a **3-sided marketplace** connecting:
1. **Diners** — discover, browse, order food
2. **Restaurant Owners** — build menus, manage orders, grow business
3. **Delivery Drivers** — join a flexible delivery network, work directly with restaurants

**What makes us different**: Restaurants control their own delivery. No middleman fees. No 30% cuts. Owners hire drivers directly from our network. Drivers deal with restaurants, not with us. We're the connector, not the controller.

---

## Page Architecture

### URL Structure

| URL | Audience | Purpose |
|-----|----------|---------|
| `/` | Diners (consumers) | Food discovery, explore, sign up |
| `/for-restaurants` | Restaurant owners | Build menus, pricing, sign up |
| `/for-drivers` | Delivery drivers | Join network, earn money |
| `/explore` | Diners | Browse restaurants by city/cuisine |
| `/explore/[city]` | Diners | City-specific restaurant listings |
| `/menu/[slug]` | Diners | View & order from a restaurant |
| `/login` | All | Sign in |
| `/register` | All | Create account |

### Route Group Strategy

```
src/app/
  page.tsx                      # Consumer landing (/)
  for-restaurants/
    page.tsx                    # Restaurant owner landing
  for-drivers/
    page.tsx                    # Driver recruitment page
  explore/                      # Existing explore pages
  (auth)/                       # Existing auth group
  (authenticatedRoutes)/        # Existing dashboard
```

No new route groups needed — just two new top-level pages.

---

## Visual Identity Per Audience

### Consumer Landing (`/`) — "The Food Lover"

**Palette**: Warm, appetizing, inviting
- Primary: Ember/Terracotta (existing)
- Background: Cream/Sand (existing warm tones)
- Accents: Gold, Mint (fresh, food-associated)
- Image-heavy: Real food photography, restaurant interiors, Morocco street food

**Mood**: Instagram food page meets Moroccan riad. Lush, warm, makes you hungry.

**Typography**: Playfair Display headlines (elegant) + DM Sans body (clean)

**Key Sections**:
1. **Hero**: Full-width food imagery hero with search bar overlay. "Discover Morocco's Best Food" + city search. Think Airbnb-meets-Deliveroo.
2. **Trending Near You**: Live restaurant cards with ratings, photos, cuisine tags
3. **City Showcase**: Casablanca, Marrakech, Rabat, Fes — gradient cards with food imagery
4. **Cuisine Explorer**: Tagine, Couscous, Pastilla, Mint Tea, Street Food — horizontal scroll
5. **How It Works (Diner)**: Scan QR → Browse Menu → Order → Enjoy
6. **App-like Experience**: Show phone mockup scanning QR, instant menu load
7. **Social Proof**: "500+ restaurants", "12 cities", real diner testimonials
8. **CTA**: "Explore Restaurants" (primary), "Own a restaurant?" (subtle link to /for-restaurants)

**Images Needed**:
- Hero: Moroccan food spread (tagine, couscous, pastries, mint tea)
- City cards: Casablanca skyline, Marrakech medina, Rabat kasbah, Fes tanneries
- Cuisine: Individual dish photos (tagine, couscous, pastilla, msemen, harira)
- Phone mockup: QR scan demonstration

### Restaurant Owner Landing (`/for-restaurants`) — "The Business Builder"

**Palette**: Professional, trustworthy, growth-oriented
- Primary: Deep Indigo (228 45% 20%) — authoritative
- Accents: Ember (CTA buttons), Gold (premium features)
- Background: Clean white with subtle indigo tints
- Image style: Dashboard screenshots, happy restaurant owners, data visualizations

**Mood**: Stripe/Linear-inspired SaaS. Clean, professional, "this tool will grow my business."

**Typography**: Same fonts but more structured, less playful

**Key Sections**:
1. **Hero**: "Your Restaurant, Your Rules" — split with product screenshot. Zero commission messaging front and center.
2. **The Problem**: "Glovo takes 30%. Paper menus cost money. You lose customers." Pain-point driven.
3. **The Solution**: Feature showcase — QR menus, AI content, analytics, multi-language
4. **How It Works (Owner)**: Create Menu → Generate QR → Customers Order → You Earn 100%
5. **Delivery Network**: "Your delivery, your way" — Connect with local drivers, set your own fees, no middleman
6. **Pricing**: Free/Pro/Enterprise cards (existing PricingSection)
7. **Comparison Table**: Diyafa vs Glovo vs Done.ma vs Paper (existing ComparisonSection)
8. **Testimonials**: Restaurant owner quotes
9. **FAQ**: Owner-specific questions
10. **CTA**: "Create Your Free Menu" + "Book a Demo"

### Driver Landing (`/for-drivers`) — "The Earner"

**Palette**: Energetic, bold, street-smart
- Primary: Mint/Teal (160 40% 55%) — fresh, active, go-energy
- Accents: Ember (action), Gold (earnings)
- Background: White with mint-tinted sections
- Image style: Scooter riders, delivery bags, mobile phones with earnings, Moroccan streets

**Mood**: Bolt/Uber driver recruitment — energetic, flexible, freedom-focused

**Typography**: DM Sans only (modern, no-nonsense). Bold weights for impact.

**Key Sections**:
1. **Hero**: "Deliver & Earn on Your Terms" — rider on scooter in Moroccan medina. Earnings counter animation.
2. **How It's Different**: "Work directly with restaurants. No algorithm boss. You choose your restaurants, you set your availability."
3. **How It Works**: Sign Up → Connect with Restaurants → Deliver → Get Paid Directly
4. **Earnings Calculator**: Interactive — "Deliver X orders/day in [City] = X MAD/month"
5. **Benefits**: Flexible hours, no commission to us, direct restaurant relationships, multiple restaurants
6. **Requirements**: Scooter/bike, phone, valid ID, clean record
7. **Cities**: Where we operate — Casablanca, Marrakech, Rabat, Fes (expandable)
8. **Driver Testimonials**: Real driver quotes
9. **CTA**: "Start Delivering Today" — simple sign-up form

---

## Shared Components

### Navbar (Audience-Aware)

The navbar adapts based on the page context:

| Page | Nav Items | CTA |
|------|-----------|-----|
| `/` (Consumer) | Explore, For Restaurants, For Drivers | Login |
| `/for-restaurants` | Features, Pricing, For Drivers | Get Started Free |
| `/for-drivers` | How It Works, Cities, For Restaurants | Sign Up to Deliver |
| Dashboard | Dashboard, Explore, etc. | (user menu) |

### Footer (Unified)

Keep one footer but organize by audience:
- **For Diners**: Explore, Cities, Cuisines
- **For Restaurants**: Features, Pricing, API
- **For Drivers**: Sign Up, Cities, FAQ
- **Company**: About, Blog, Contact, Legal

### Cross-Linking

Every audience page subtly links to the other two:
- Consumer page: "Own a restaurant?" strip → /for-restaurants
- Restaurant page: "Need delivery drivers?" → /for-drivers
- Driver page: "Own a restaurant?" → /for-restaurants

---

## Image Strategy

### Approach: AI-Generated + Optimized

Since we need Morocco-specific food/city imagery and can't use stock photos that look generic:

1. **AI-generated images** via GPT-Image-1 or similar for:
   - Moroccan food spreads (hero backgrounds)
   - City skylines/landmarks
   - Individual dish photography
   - Driver/delivery lifestyle shots

2. **Format**: WebP for web, with Next.js Image optimization
3. **Storage**: `/public/images/landing/`, `/public/images/restaurants/`, `/public/images/drivers/`
4. **Fallback**: CSS gradient placeholders (existing MoroccanFoodArt as loading state)

### Image Checklist

```
public/images/
  landing/
    hero-food-spread.webp        # Moroccan feast table (1920x800)
    city-casablanca.webp         # City card (800x600)
    city-marrakech.webp
    city-rabat.webp
    city-fes.webp
    cuisine-tagine.webp          # Cuisine card (400x400)
    cuisine-couscous.webp
    cuisine-pastilla.webp
    cuisine-msemen.webp
    cuisine-harira.webp
    cuisine-mint-tea.webp
    phone-mockup.webp            # QR scan demo (600x800)
  restaurants/
    hero-dashboard.webp          # Product screenshot (1920x1080)
    owner-happy.webp             # Restaurant owner (800x600)
    feature-qr.webp              # QR code on table (600x400)
    feature-analytics.webp       # Dashboard analytics (600x400)
    feature-menu.webp            # Menu editor (600x400)
  drivers/
    hero-rider.webp              # Scooter delivery in medina (1920x800)
    earnings-phone.webp          # Phone with earnings screen (400x600)
    delivery-bag.webp            # Branded delivery bag (600x400)
```

---

## Delivery Network Concept

### The Model

```
Traditional:  Restaurant → Platform (30% cut) → Driver → Customer
Diyafa:      Restaurant → Driver (direct deal) → Customer
              Diyafa = connector + tools, NOT middleman
```

### How It Works

1. **Drivers register** on Diyafa, create a profile (city, vehicle type, availability)
2. **Restaurants browse** available drivers in their area
3. **Restaurant hires** drivers directly — sets delivery fee, schedule, zone
4. **Orders come in** → Restaurant assigns to their connected driver
5. **Driver delivers** → Gets paid directly by restaurant (cash or transfer)
6. **Diyafa charges**: Nothing for connecting. Revenue from Pro subscription only.

### What We Build (Backend - Future Sprint)

- `Driver` model in Prisma (name, city, vehicle, phone, availability, rating)
- `RestaurantDriver` join table (restaurant ↔ driver relationships)
- Driver dashboard page (`/dashboard/drivers` for restaurant owners)
- Driver profile page (`/driver/[id]` for restaurants to review)
- Driver availability calendar
- Order assignment to specific driver

### What We Build Now (This Sprint - Landing Only)

- `/for-drivers` static landing page (recruitment, information)
- Sign-up form (collect: name, phone, city, vehicle type)
- Store in existing Contact/Lead table or new `DriverApplication` table
- No operational features yet — just recruitment

---

## Technical Implementation

### New Files

```
src/app/for-restaurants/page.tsx          # Route + metadata
src/app/for-drivers/page.tsx              # Route + metadata
src/pageComponents/ForRestaurants/        # Page component + molecules
src/pageComponents/ForDrivers/            # Page component + molecules
public/images/landing/                    # Consumer images
public/images/restaurants/                # Owner images
public/images/drivers/                    # Driver images
```

### Color System (Per-Page)

Add CSS classes that can override the color scheme per page:

```css
.theme-consumer { /* warm, food-focused - existing ember/sand palette */ }
.theme-business { /* professional, indigo-primary */ }
.theme-driver   { /* energetic, mint-primary */ }
```

Apply at page root: `<div className="theme-business">...</div>`

### i18n Keys

```
forRestaurants.hero.title
forRestaurants.hero.subtitle
forRestaurants.features.*
forRestaurants.pricing.*
forRestaurants.cta.*

forDrivers.hero.title
forDrivers.hero.subtitle
forDrivers.howItWorks.*
forDrivers.benefits.*
forDrivers.cta.*
```

All in EN/FR/AR.

---

## Implementation Priority

### Phase 1 (This Sprint)
1. Update `/` consumer landing with real images + pure food discovery focus
2. Create `/for-restaurants` page (move business content here)
3. Create `/for-drivers` page (recruitment landing)
4. Update Navbar for audience-aware navigation
5. Update Footer with 3-audience sections
6. i18n for all new content (EN/FR/AR)

### Phase 2 (Next Sprint)
1. Driver application form + backend storage
2. AI-generated images for all pages
3. Interactive earnings calculator on driver page
4. Product screenshots for restaurant page
5. SEO optimization per page

### Phase 3 (Future)
1. Driver dashboard + management
2. RestaurantDriver connection system
3. Order assignment to drivers
4. Driver availability/scheduling
5. Driver ratings/reviews

---

## Success Metrics

- **Consumer page**: Explore clicks, menu views, order starts
- **Restaurant page**: Sign-up conversions, menu creation rate
- **Driver page**: Application submissions, city coverage
- **Cross-page**: Navigation between audience pages (shows platform awareness)
