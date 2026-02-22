# Morocco Payment Gateway Research for FeastQR

**Research Date**: February 14, 2026
**Scope**: Payment integration options for a Next.js 14 + tRPC SaaS app targeting Moroccan restaurants
**Confidence Assessment**: See per-section confidence ratings

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Market Context](#market-context)
3. [CMI (Centre Monetique Interbancaire)](#1-cmi-centre-monetique-interbancaire)
4. [Payzone Morocco](#2-payzone-morocco)
5. [YouCan Pay](#3-youcan-pay-recommended-for-feastqr)
6. [MarocPay (Mobile Wallet Interoperability)](#4-marocpay-mobile-wallet-interoperability)
7. [Orange Money](#5-orange-money)
8. [Cash on Delivery (COD)](#6-cash-on-delivery-cod)
9. [Chari BaaS](#7-chari-baas-emerging)
10. [Cash Collection Points (CashPlus, Wafacash)](#8-cash-collection-points-cashplus-wafacash)
11. [Stripe / PayPal Status](#9-stripe--paypal-status)
12. [Comparison Matrix](#comparison-matrix)
13. [Recommended Integration Strategy](#recommended-integration-strategy-for-feastqr)
14. [Implementation Plan](#implementation-plan)
15. [Sources](#sources)

---

## Executive Summary

Morocco's payment landscape is fragmented and cash-dominant. **84% of Moroccan consumers prefer cash on delivery**, and only 32% of card transactions are payments (vs. 68% ATM withdrawals). However, digital payments are growing rapidly: card payments grew 17% YoY in 2024, instant transfers processed 16.3 million transactions, and mobile wallet ownership jumped from 0.6% to 6.3% in one year.

**Key findings for FeastQR:**

1. **Stripe is NOT available in Morocco** -- Moroccan merchants cannot open Stripe accounts. LemonSqueezy (which uses Stripe) will only work for international customers or through a foreign entity.
2. **CMI is the dominant card processor** -- handles ~85 million transactions/year, but requires a Moroccan business entity and bank account.
3. **YouCan Pay is the best fit for FeastQR** -- Moroccan-built, has a Node.js SDK with TypeScript support, supports MAD currency natively, has CashPlus integration, sandbox mode, and is designed for SaaS/e-commerce.
4. **COD is non-negotiable** -- 70-84% of e-commerce purchases use COD. Any Morocco-targeting app MUST support it.
5. **Payzone has a REST API** but documentation is difficult to access and no npm package exists.
6. **Chari's BaaS APIs are emerging** -- first VC-backed fintech with BAM payment license (October 2025), offering APIs for card issuance, KYC, and wallet processing. Worth monitoring.

---

## Market Context

**Confidence: HIGH** (Bank Al-Maghrib official statistics, Morocco World News, Statista)

| Metric | Value | Year |
|--------|-------|------|
| E-commerce market size | MAD 22+ billion (~$2.2B) | 2023 |
| Cash preference for e-commerce | 70-84% | 2024 |
| Card payment transactions | 192.5 million (+17% YoY) | 2024 |
| Instant transfer transactions | 16.3 million | 2024 |
| Mobile wallet ownership | 6.3% | 2023 |
| Digital payment users (projected) | 22.82 million | 2028 |
| ATM withdrawal share vs. payments | 68% / 32% | 2024 |
| Online shoppers growth | +3.7 million new | 2024 |
| Mobile transaction share | 85%+ | 2025 |

**Regulatory context**: CMI must transfer all merchant contracts to licensed acquiring operators by January 31, 2026. CMI will become a neutral switching/clearing platform. This means new PSPs (Payment Service Providers) are entering the market, and the landscape is shifting.

---

## 1. CMI (Centre Monetique Interbancaire)

**Confidence: HIGH** (official website, open-source packages, multiple developer sources)

### Overview

CMI is Morocco's central card payment processor, connecting all Moroccan banks. It handles Visa, Mastercard, and all local bank card transactions. Every card-based online payment in Morocco ultimately flows through CMI infrastructure.

### How the API Works

CMI uses a **redirect-based payment flow** (similar to PayPal classic or Stripe Checkout):

1. **Merchant server** prepares payment parameters and generates an HMAC-SHA512 hash
2. **HTML form** with hidden fields is auto-submitted (POST) to CMI's payment gateway
3. **Customer** enters card details on CMI's hosted payment page (PCI-DSS compliant)
4. **3D Secure** verification occurs (mandatory in Morocco)
5. **CMI redirects** to `okUrl` (success) or `failUrl` (failure)
6. **Server-to-server callback** is sent to `callbackURL` for confirmation

### npm Package

**Package**: `cmi-payment-nodejs`
**Install**: `npm i cmi-payment-nodejs`
**Repository**: https://github.com/aitmiloud/cmi-node

```typescript
// Installation
// npm i cmi-payment-nodejs

import cmi from 'cmi-payment-nodejs';

const CmiClient = new cmi.default({
  storekey: 'YOUR_STOREKEY',           // Provided by CMI
  clientid: 'YOUR_CLIENTID',           // Provided by CMI
  oid: 'ORDER-12345',                  // Unique order ID
  shopurl: 'https://feastqr.com',      // Your site URL
  okUrl: 'https://feastqr.com/api/payments/cmi/success',
  failUrl: 'https://feastqr.com/api/payments/cmi/fail',
  callbackURL: 'https://feastqr.com/api/payments/cmi/callback',
  email: 'restaurant@example.com',
  BillToName: 'Restaurant Name',
  amount: '199.00',                    // Amount in MAD
  tel: '+212600000000',
});

// This returns an HTML form that auto-submits to CMI
const htmlForm = CmiClient.redirect_post();
// Send this HTML to the client: res.send(htmlForm);
```

### Parameters Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `storekey` | string | Yes | HMAC secret key (from CMI) |
| `clientid` | string | Yes | Merchant ID (from CMI) |
| `oid` | string | Yes | Unique order/transaction ID |
| `amount` | string | Yes | Amount (e.g., "199.00") |
| `shopurl` | string | Yes | Merchant website URL |
| `okUrl` | string | Yes | Success redirect URL |
| `failUrl` | string | Yes | Failure redirect URL |
| `callbackURL` | string | Yes | Server-to-server notification URL |
| `email` | string | Yes | Customer email |
| `BillToName` | string | Yes | Customer/billing name |
| `tel` | string | No | Customer phone |
| `currency` | string | No | Currency code (default: "504" = MAD) |
| `lang` | string | No | Payment page language |
| `storetype` | string | No | Default: "3d_pay_hosting" |
| `TranType` | string | No | Default: "PreAuth" |
| `hashAlgorithm` | string | No | Default: "ver3" (SHA512) |

### Hash Calculation

The package internally generates an HMAC-SHA512 hash using:
- All payment parameters concatenated in a specific order
- The `storekey` as the HMAC secret
- Hash algorithm: SHA-512

The callback response also includes a hash that MUST be verified server-side to prevent tampering.

### Test Cards

| Type | Number | CVC | Expiry |
|------|--------|-----|--------|
| Visa | `4000 0000 0000 0010` | 000 | Any future |
| MasterCard | `5453 0100 0006 6100` | 000 | Any future |
| MC 3D Secure | `5191 6301 0000 4896` | 000 | Any future (auth: 123) |

### Currencies

- Primary: **MAD** (Moroccan Dirham, code 504)
- Multi-currency DCC (Dynamic Currency Conversion) launched February 2025: EUR, USD, GBP, JPY, CAD, CHF

### Fees

| Fee Type | Amount |
|----------|--------|
| Moroccan cards | ~2.0% per transaction |
| Foreign cards | ~3.25% per transaction |
| PSP commission | ~0.5% (included in above) |
| Interchange (regulated) | 0.65% (reduced 40% in 2025) |
| Setup | Generally free |
| Monthly | Negotiable based on volume |

### Requirements to Get CMI Credentials

- Legally registered business in Morocco (RC, ICE, IF numbers)
- Moroccan bank account
- Functional HTTPS website with Terms & Conditions
- CNDP registration (Moroccan data protection authority)
- Application through your bank (Attijariwafa, BMCE, CIH, etc.)
- Approval timeline: 2-4 weeks typically

### Limitations for FeastQR

- **No self-service signup** -- requires a Moroccan business entity
- **Redirect-based flow only** -- no embedded/inline card form
- **npm package is community-maintained** (last updated: check repo activity)
- **Limited TypeScript support** in the npm package
- **No subscription/recurring billing support** natively

---

## 2. Payzone Morocco

**Confidence: MEDIUM** (developer portal exists but was unreachable during research; limited public documentation)

### Overview

Payzone (operated by VPS Corp / Vantage Payment Systems) is a PSP targeting SMBs and startups in Morocco. It supports Visa, Mastercard, and mobile wallets (Orange Money, MTN Mobile Money). In June 2025, VPS partnered with Mastercard to advance payment innovation in Morocco.

### API Architecture

Payzone offers two API types:

1. **Payment Gateway API** -- REST-based, JSON payloads, HTTP Basic authentication
2. **Payment Page API** -- REST-based hosted payment page (redirect model)

**Developer portal**: https://developers.payzone.ma/
**Gateway docs**: https://developers.payzone.ma/gateway
**Payment Page docs**: https://developers.payzone.ma/PaymentPageAPI

### Authentication

- HTTP Basic Authentication
- Credentials provided at subscription to the service

### Integration Pattern (Inferred from Documentation References)

```
POST /api/v1/payments
Content-Type: application/json
Authorization: Basic base64(username:password)

{
  "amount": 19900,          // Amount in cents (MAD)
  "currency": "MAD",
  "orderId": "ORDER-12345",
  "description": "Menu subscription",
  "customer": {
    "email": "restaurant@example.com",
    "name": "Restaurant Name"
  },
  "successUrl": "https://feastqr.com/payments/success",
  "errorUrl": "https://feastqr.com/payments/error",
  "callbackUrl": "https://feastqr.com/api/payments/payzone/webhook"
}
```

### npm Package

**No official npm package exists.** Integration would need to be done via raw HTTP calls using `fetch` or `axios`.

### Supported Payment Methods

- Visa / Mastercard
- Orange Money
- MTN Mobile Money (less relevant in Morocco)

### Fees

- Moroccan cards: ~2.0%
- Foreign cards: ~3.25%
- Exact fee structure is negotiable and not publicly listed

### Contact for Integration

- Technical support: support@vpscorp.ma
- Website: https://payzone.ma

### Limitations for FeastQR

- **Developer portal was unreachable** during this research (timeout)
- **No npm package** -- requires custom HTTP client wrapper
- **Limited public documentation** -- most details require signing up first
- **No TypeScript types** available

---

## 3. YouCan Pay (RECOMMENDED for FeastQR)

**Confidence: HIGH** (official docs, working Node.js SDK, test environment)

### Overview

YouCan Pay is a Moroccan-built payment gateway designed specifically for the Moroccan market. It offers a modern developer experience with SDKs, webhooks, sandbox mode, and CashPlus integration. Created by the team behind YouCan (Moroccan e-commerce platform).

### Why YouCan Pay is the Best Fit

1. **Node.js SDK with TypeScript** -- `youcan-payment-nodejs-sdk`
2. **MAD-native** -- built for Moroccan dirham transactions
3. **CashPlus integration** -- customers can pay at CashPlus points
4. **Sandbox mode** -- full test environment with test cards
5. **Webhook support** -- proper event-driven architecture
6. **3D Secure** -- handled automatically
7. **Multi-language** -- supports `en`, `fr`, `ar` (matches FeastQR's i18n)
8. **Self-service signup** -- no bank partnership required to start

### Installation

```bash
# Node.js SDK
yarn add youcan-payment-nodejs-sdk
# or
npm install youcan-payment-nodejs-sdk

# Frontend widget (CDN)
# <script src="https://pay.youcan.shop/js/ycpay.js"></script>
```

### Authentication

- **Private key**: `pri_xxx` (backend only, NEVER expose)
- **Public key**: `pub_xxx` (frontend safe)
- **Sandbox keys**: `pri_sandbox_xxx` / `pub_sandbox_xxx`

Keys available in account settings dashboard.

### Backend Integration (tRPC Router)

```typescript
import YouCanPay from 'youcan-payment-nodejs-sdk';

// Initialize
const youCanPay = new YouCanPay(
  process.env.YOUCANPAY_PRIVATE_KEY!, // pri_xxx or pri_sandbox_xxx
  process.env.NODE_ENV !== 'production' // sandbox mode
);

// --- In your tRPC router ---

// Method 1: Generate token for embedded form
const token = await youCanPay.getToken({
  amount: 19900,                    // Amount in centimes (199.00 MAD)
  currency: 'MAD',                  // CurrencyCode.MAD
  customer_ip: '127.0.0.1',        // Customer's IP
  order_id: 'ORDER-12345',         // Your unique order ID
  success_url: 'https://feastqr.com/payments/success',
  error_url: 'https://feastqr.com/payments/error',
  customer: {
    name: 'Restaurant Owner',
    address: '123 Avenue Mohammed V',
    zip_code: '20000',
    city: 'Casablanca',
    state: 'Casablanca-Settat',
    country_code: 'MA',
    phone: '+212600000000',
    email: 'owner@restaurant.ma',
  },
});
// token.id = "71d8c27-2416-41ee-b750-d6382f72a565"

// Method 2: Generate standalone payment page URL
const paymentUrl = await youCanPay.getPaymentUrl(
  {
    amount: 19900,
    currency: 'MAD',
    customer_ip: '127.0.0.1',
    order_id: 'ORDER-12345',
    success_url: 'https://feastqr.com/payments/success',
    error_url: 'https://feastqr.com/payments/error',
  },
  'fr' // Language: 'en' | 'fr' | 'ar'
);
// Returns: https://youcanpay.com/payment-form/{tokenId}?lang=fr

// Verify transaction
const transaction = await youCanPay.transaction.get('transaction-id');
const amount = transaction.getBaseAmount() ?? transaction.getAmount();
```

### Frontend Integration (React Component)

```tsx
// components/YouCanPayForm.tsx
"use client";

import { useEffect, useRef } from 'react';

interface YouCanPayFormProps {
  tokenId: string;
  publicKey: string;
  isSandbox: boolean;
  locale: 'en' | 'fr' | 'ar';
}

declare global {
  interface Window {
    YCPay: new (publicKey: string, options: {
      formContainer: string;
      errorContainer: string;
      locale: string;
      isSandbox: boolean;
    }) => {
      renderCreditCardForm: () => void;
      pay: (tokenId: string) => Promise<void>;
    };
  }
}

export function YouCanPayForm({ tokenId, publicKey, isSandbox, locale }: YouCanPayFormProps) {
  const ycPayRef = useRef<InstanceType<typeof window.YCPay> | null>(null);

  useEffect(() => {
    const ycPay = new window.YCPay(publicKey, {
      formContainer: '#payment-container',
      errorContainer: '#error-container',
      locale,
      isSandbox,
    });
    ycPay.renderCreditCardForm();
    ycPayRef.current = ycPay;
  }, [publicKey, isSandbox, locale]);

  const handlePay = async () => {
    try {
      await ycPayRef.current?.pay(tokenId);
      // Success: customer redirected to success_url
    } catch (error) {
      // Error displayed in #error-container
      console.error('Payment failed:', error);
    }
  };

  return (
    <div>
      <div id="payment-container" />
      <div id="error-container" className="text-red-500 mt-2" />
      <button
        onClick={handlePay}
        className="mt-4 w-full bg-primary text-white py-2 rounded"
      >
        Pay Now
      </button>
    </div>
  );
}
```

### Webhook Handling (Next.js API Route)

```typescript
// src/app/api/payments/youcanpay/webhook/route.ts
import { NextResponse } from 'next/server';

interface YouCanPayWebhookPayload {
  id: string;
  event_name: 'transaction.paid' | 'transaction.failed';
  sandbox: boolean;
  payload: {
    transaction: {
      id: string;
      amount: number;
      currency: string;
      order_id: string;
      status: number;
    };
    payment_method: {
      card: {
        brand: string;
        last_digits: string;
        is_3d_secure: boolean;
      };
    };
    customer: {
      name: string;
      email: string;
    };
    metadata: Record<string, string>;
  };
}

export async function POST(req: Request) {
  const body: YouCanPayWebhookPayload = await req.json();

  if (body.event_name === 'transaction.paid') {
    const { order_id, amount } = body.payload.transaction;

    // Update your database
    // await prisma.payment.update({
    //   where: { orderId: order_id },
    //   data: { status: 'PAID', amount },
    // });
  }

  if (body.event_name === 'transaction.failed') {
    const { order_id } = body.payload.transaction;
    // Handle failure
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

### Test Cards

| Scenario | Number | CVV | Expiry |
|----------|--------|-----|--------|
| Success (no 3DS) | `4242 4242 4242 4242` | 112 | 10/24 |
| Success (3DS) | `4000 0000 0000 3220` | 112 | 10/24 |
| Rejected (3DS) | `4000 0084 0000 1629` | 112 | 10/24 |
| Insufficient funds | `4000 0000 0000 0077` | 112 | 10/24 |

### Supported Payment Methods

- Visa / Mastercard (3D Secure compatible)
- **CashPlus** (customers pay at physical CashPlus locations)

### Fees

- Not publicly listed on website; competitive with CMI
- Self-service signup is free
- Commission per transaction (contact for exact rates)

### Limitations

- **No recurring/subscription billing** natively (would need to build on top)
- Node.js SDK is community-maintained (27 commits, MIT license)
- SDK TypeScript types should be verified against current API

---

## 4. MarocPay (Mobile Wallet Interoperability)

**Confidence: MEDIUM** (official website exists, limited developer documentation)

### Overview

MarocPay is the **interoperable mobile payment system** activated by CMI under supervision of Bank Al-Maghrib. It enables payments across all Moroccan mobile wallets regardless of bank -- a customer with a CIH wallet can pay a merchant using an Attijariwafa terminal.

### Key Facts

- **8+ million wallet holders** in Morocco
- Free M-wallet for consumers
- Interoperable across all Moroccan banks
- QR-code based payments (fits well with FeastQR's QR model)

### How It Works (Merchant Side)

1. Merchant registers with their bank for MarocPay acceptance
2. Merchant receives a MarocPay merchant QR code
3. Customer scans QR code with any compatible M-wallet app
4. Payment is processed through CMI's switching infrastructure
5. Funds settle to merchant's bank account

### Developer Integration

**There is NO public API for direct integration.** MarocPay operates through:
- Bank-provided POS terminals
- Bank mobile apps
- CMI switching infrastructure

To accept MarocPay in a web app, you would need to:
1. Partner with a bank that offers MarocPay merchant services
2. Generate MarocPay-compatible QR codes (bank provides specifications)
3. Receive settlement through your bank's reconciliation process

### Wallet Providers Compatible with MarocPay

| Wallet | Provider |
|--------|----------|
| CIH MOBILE | CIH Bank |
| MT CASH | Credit du Maroc |
| Jibi | Al Barid Bank |
| Filahi Pay | Credit Agricole |
| Orange et moi | Orange Morocco |
| Inwi Money | inwi |

### Limitation for FeastQR

- No direct API integration possible
- Operates through banking infrastructure only
- Best used for in-person QR payments at physical restaurants, not for online SaaS billing

---

## 5. Orange Money

**Confidence: MEDIUM-LOW** (API exists for other African countries; Morocco availability unconfirmed)

### Overview

Orange Money is a mobile wallet service available across Africa. Orange provides a Web Payment API for merchant integration.

### API Status in Morocco

**IMPORTANT**: The Orange Money Web Payment API (developer.orange.com) is currently available in: Mali, Cameroon, Senegal, Madagascar, Botswana, Guinea Conakry, Sierra Leone, Cote d'Ivoire, Guinea Bissau, and Liberia. **Morocco is NOT confirmed** in the list of available countries as of this research.

The Orange Developer portal states that merchants in new countries "will be emailed" when the API becomes available.

### API Overview (For Reference When Available)

- **Portal**: https://developer.orange.com/apis/om-webpay
- **Auth**: OAuth 2.0 (client credentials flow)
- **Payment flow**: Web redirect to Orange Money payment page
- **Webhooks**: Payment notification callbacks

### Recommendation

Do NOT build an Orange Money integration now. Monitor https://developer.orange.com for Morocco availability. If/when it launches, it could be valuable for reaching unbanked users.

---

## 6. Cash on Delivery (COD)

**Confidence: HIGH** (multiple authoritative sources, market data)

### Why COD is Essential

| Metric | Value |
|--------|-------|
| COD preference | 70-84% of e-commerce purchases |
| Unbanked population | ~70% of adults |
| Card ownership | ~30% of adults |
| Cash for small merchants | 79% use cash exclusively |

### Best Practices for Web App Implementation

#### 6.1 Order Confirmation Flow

```
Customer places order
  --> Order status: PENDING_CONFIRMATION
  --> Auto-send WhatsApp/SMS confirmation
  --> Wait for customer confirmation (reply or callback)
  --> Order status: CONFIRMED
  --> Assign to delivery
  --> Order status: OUT_FOR_DELIVERY
  --> Delivery attempts (max 2-3)
  --> Order status: DELIVERED / RETURNED
  --> Payment collected in cash
  --> Reconciliation with delivery partner
```

#### 6.2 Database Schema Additions

```prisma
model Order {
  id              String      @id @default(uuid())
  menuId          String
  status          OrderStatus @default(PENDING)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  totalAmount     Int         // in centimes
  deliveryFee     Int         @default(0)
  customerName    String
  customerPhone   String
  customerAddress String?
  deliveryNotes   String?
  confirmedAt     DateTime?
  deliveredAt     DateTime?
  paidAt          DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum PaymentMethod {
  CARD
  COD
  MOBILE_WALLET
  CASHPLUS
}

enum PaymentStatus {
  PENDING
  COLLECTED
  RECONCILED
  REFUNDED
  FAILED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  RETURNED
}
```

#### 6.3 Key Implementation Considerations

1. **Phone verification**: ALWAYS verify customer phone before accepting COD orders (OTP via WhatsApp or SMS). Morocco has high COD rejection rates (~20-30%).

2. **Order amount limits**: Set maximum COD order amounts (e.g., MAD 2000) to limit exposure.

3. **Deposit/prepayment option**: Offer a small card prepayment (e.g., 10-20 MAD) to reduce no-shows.

4. **Multi-carrier integration**: Work with 2-3 Moroccan delivery companies:
   - **Amana** (Barid Al-Maghrib / Morocco Post)
   - **GLS Morocco**
   - **Aramex Morocco**
   - **CODSPOT** (specialized COD platform)

5. **Cash reconciliation**: Daily reconciliation of collected cash vs. orders delivered. Delivery partners typically remit collected funds weekly.

6. **WhatsApp integration**: Essential for Morocco. Use WhatsApp Business API for:
   - Order confirmation
   - Delivery status updates
   - Reorder prompts
   - Customer support

7. **Mobile-first design**: 85%+ of Morocco e-commerce traffic is mobile.

#### 6.4 COD-Specific tRPC Mutations

```typescript
// Conceptual tRPC router for COD orders
export const ordersRouter = router({
  createCodOrder: privateProcedure
    .input(z.object({
      menuId: z.string().uuid(),
      items: z.array(z.object({
        dishId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variantId: z.string().uuid().optional(),
      })),
      customerName: z.string().min(2),
      customerPhone: z.string().regex(/^\+212[567]\d{8}$/), // Moroccan format
      customerAddress: z.string().optional(),
      deliveryNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Validate items and calculate total
      // 2. Create order with paymentMethod: 'COD'
      // 3. Send WhatsApp confirmation
      // 4. Return order details
    }),

  confirmCodOrder: privateProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Restaurant confirms the order
      // Update status to CONFIRMED
      // Notify customer
    }),

  markCodCollected: privateProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      collectedAmount: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Mark payment as collected
      // Reconciliation entry
    }),
});
```

---

## 7. Chari BaaS (Emerging)

**Confidence: MEDIUM** (well-funded, licensed, but APIs not yet publicly available)

### Overview

Chari (YC S21) became the first VC-backed startup in Morocco to receive a Bank Al-Maghrib payment institution license in October 2025. They raised $12M Series A and are building a Banking-as-a-Service platform.

### What They Offer

- **Payment gateway** (POS and online)
- **Card issuance** via API
- **KYC/identity verification** via API
- **Digital wallet processing** via API
- **Payment accounts** with Moroccan IBANs
- **Bill payments** and mobile top-ups

### Developer Integration

Chari is packaging their technology into an **API-based BaaS platform** for third parties. However, as of February 2026, the public developer documentation is not yet available.

### Why It Matters for FeastQR

- If/when Chari's APIs launch publicly, they could provide a one-stop solution for:
  - Online card payments
  - Mobile wallet acceptance
  - Cash collection through their 100,000+ retail point network
  - Customer identity verification

### Action Item

Monitor https://chari.ma for developer API announcements. Contact partnerships@chari.ma for early access.

---

## 8. Cash Collection Points (CashPlus, Wafacash)

**Confidence: MEDIUM** (established businesses, but limited public API documentation)

### CashPlus

- **4,500+ points** across Morocco
- Integrated into YouCan Pay (customers select CashPlus at checkout)
- Cash-to-digital payment bridge
- No direct API for independent integration

**Best approach**: Use through YouCan Pay, which has native CashPlus support.

### Wafacash

- Subsidiary of **Attijariwafa Bank** (Morocco's largest bank)
- Specializes in proximity finance and financial inclusion
- Offers: money transfers, bill payments, invoice payments
- **No public API** for third-party integration
- Integration requires a business partnership agreement

### Barid Cash

- Part of **Al Barid Bank** (Moroccan postal bank)
- Network of post offices across Morocco
- Primarily for money transfers and bill payments

---

## 9. Stripe / PayPal Status

**Confidence: HIGH** (official Stripe/PayPal documentation)

### Stripe

**Morocco is NOT supported.** Stripe operates in 46 countries as of December 2025 -- Morocco is not among them. LemonSqueezy (which FeastQR currently uses) relies on Stripe and therefore also does not support Moroccan merchant accounts.

**Workaround**: Register a business entity in a Stripe-supported country (France, Spain, etc.) and use that as the merchant of record. This is legally complex and may not comply with Moroccan financial regulations.

### PayPal

**Partially available** with significant restrictions:
- Moroccan users can open PayPal accounts
- Transactions limited to **MAD only**
- Only **domestic** send/receive supported
- Cannot receive international payments
- Withdrawal to Moroccan bank accounts has limitations

**Verdict**: PayPal is not viable as a primary payment method for FeastQR in Morocco.

---

## Comparison Matrix

| Feature | CMI | Payzone | YouCan Pay | MarocPay | COD |
|---------|-----|---------|------------|----------|-----|
| **npm package** | Yes (community) | No | Yes (TypeScript) | No | N/A |
| **REST API** | No (form POST) | Yes | Yes | No | N/A |
| **Sandbox/Test** | Yes | Unknown | Yes | No | N/A |
| **Webhooks** | Callback URL | Yes | Yes (JSON) | No | N/A |
| **MAD support** | Yes | Yes | Yes (native) | Yes | Yes |
| **Card payments** | Visa/MC | Visa/MC | Visa/MC | No | No |
| **Mobile wallets** | Via MarocPay | Orange Money | No | All wallets | No |
| **CashPlus** | No | No | Yes | No | No |
| **3D Secure** | Mandatory | Yes | Auto | N/A | N/A |
| **Self-service** | No (bank req.) | Unknown | Yes | No (bank req.) | N/A |
| **Recurring billing** | No | Unknown | No | No | No |
| **Fees (local)** | ~2.0% | ~2.0% | Competitive | Free | Delivery cost |
| **Setup time** | 2-4 weeks | Unknown | Minutes | Weeks | Immediate |
| **Multi-language** | Yes | Unknown | en/fr/ar | N/A | N/A |
| **Market coverage** | ~100% cards | Growing | Growing | 8M wallets | ~84% consumers |

---

## Recommended Integration Strategy for FeastQR

### Phase 1: Immediate (Launch MVP)

1. **YouCan Pay** -- Primary card payment gateway
   - Fastest to integrate (Node.js SDK + TypeScript)
   - Sandbox for development
   - CashPlus built-in (covers cash-preferring customers)
   - MAD native, fr/ar/en language support

2. **Cash on Delivery** -- For restaurant orders
   - Essential for Morocco market
   - Phone verification via WhatsApp
   - Order tracking and reconciliation

3. **Keep LemonSqueezy** -- For international SaaS subscriptions
   - International customers paying in USD/EUR
   - Subscription management (already built)

### Phase 2: Expansion (3-6 months)

4. **CMI Direct Integration** -- When you have a Moroccan business entity
   - Better rates for high volume
   - Access to all Moroccan bank cards
   - Multi-currency DCC for tourist-heavy restaurants

5. **WhatsApp Business API** -- For COD order management
   - Order confirmations
   - Delivery notifications
   - Reorder campaigns

### Phase 3: Future (6-12 months)

6. **Chari BaaS** -- When their APIs go public
   - Unified payment solution
   - Wallet + card + cash in one API
   - KYC built-in

7. **MarocPay QR** -- For in-restaurant table payments
   - QR code already central to FeastQR
   - Wallet-based payment at table

---

## Implementation Plan

### tRPC Payment Router Architecture

```
src/server/api/routers/payments/
  index.ts          -- Main router, merges sub-routers
  youcanpay.ts      -- YouCan Pay integration
  cod.ts            -- Cash on delivery logic
  lemonsqueezy.ts   -- Existing international subscription
  types.ts          -- Shared payment types
  utils.ts          -- Hash verification, amount formatting
```

### Environment Variables to Add

```env
# YouCan Pay
YOUCANPAY_PRIVATE_KEY=pri_sandbox_xxx
YOUCANPAY_PUBLIC_KEY=pub_sandbox_xxx
YOUCANPAY_SANDBOX=true

# CMI (Phase 2)
CMI_STORE_KEY=
CMI_CLIENT_ID=
CMI_STORE_TYPE=3d_pay_hosting

# WhatsApp Business (Phase 2)
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

### Database Additions

```sql
-- New table for payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  menu_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'youcanpay' | 'cmi' | 'cod' | 'lemonsqueezy'
  provider_transaction_id TEXT,
  amount INTEGER NOT NULL, -- in centimes
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT, -- 'card' | 'cashplus' | 'cod' | 'wallet'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider, provider_transaction_id);
```

---

## Sources

### Primary (Official/Developer Documentation)
- [CMI Official Website](https://www.cmi.co.ma/)
- [YouCan Pay Documentation](https://youcanpay.com/docs)
- [YouCan Pay Node.js SDK](https://github.com/lynvi/youcan-payment-nodejs-sdk)
- [CMI Node.js Package](https://github.com/aitmiloud/cmi-node)
- [CMI PHP Package](https://github.com/mehdirochdi/cmi-payment-php)
- [Payzone Developer Portal](https://developers.payzone.ma/)
- [Payzone Payment Page API](https://developers.payzone.ma/PaymentPageAPI)
- [Orange Money Web Payment API](https://developer.orange.com/apis/om-webpay)
- [MarocPay Official](https://marocpay.ma/)
- [Stripe Global Availability](https://stripe.com/global)
- [LemonSqueezy Supported Countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)

### Secondary (Industry Analysis & News)
- [CMI Multi-Currency Payment Service (Feb 2025)](https://www.moroccoworldnews.com/2025/02/171793/cmi-introduces-multi-currency-payment-service-for-moroccan-e-commerce/)
- [Morocco Digital Payments Growth 2024 (BAM)](https://www.moroccoworldnews.com/2025/11/269538/bam-morocco-records-rapid-growth-in-digital-payments-in-2024/)
- [Morocco 3.7M New Online Shoppers](https://www.moroccoworldnews.com/2025/11/266971/moroccos-digital-market-booms-with-3-7-million-new-online-shoppers/)
- [Morocco Fintech 2025 Market Entry Guide](https://lafroujiavocats.com/en/morocco-fintech-2025-payment-market/)
- [Morocco Payment Rails (TransFi)](https://www.transfi.com/blog/moroccos-payment-rails-how-they-work---hps-switch-instant-transfers-digital-wallet-adoption)
- [Instant Payments Morocco (Lightspark)](https://www.lightspark.com/knowledge/instant-payments-morocco)
- [Payment Methods in Morocco (NORBr)](https://norbr.com/library/payworldtour/payment-methods-in-morocco/)
- [Online Payments Morocco 2025 Guide (AzulWeb)](https://azulweb.ma/en/accept-online-payments-morocco/)
- [Payment Gateways Morocco (NowPayments)](https://nowpayments.io/blog/payment-gateway-morocco)
- [Top Payment Gateways (FiNext)](https://finextcon.com/top-payment-gateways-in-morocco/)
- [Chari $12M Series A (Wamda)](https://www.wamda.com/2025/10/chari-secures-12-million-series-payment-licence-bank-al-maghrib)
- [Chari Fintech License (Lafrouji)](https://lafroujiavocats.com/en/morocco-fintech-license/)
- [VPS & Mastercard Partnership](https://www.mastercard.com/news/eemea/en/newsroom/press-releases/en/2025-1/june/vps-and-mastercard-to-advance-payment-innovation-and-financial-inclusion-in-morocco/)
- [COD Automation Morocco (CODSPOT)](https://www.codspot.io/post/complete-guide-to-cash-on-delivery-automation-in-morocco)
- [Stripe Morocco Availability](https://www.mazinooyolo.com/stripe-account-in-morocco)
- [PayPal Morocco (Doola)](https://www.doola.com/paypal-guide/how-to-open-a-paypal-account-in-morocco/)
- [Morocco e-Dirham Initiative](https://www.moroccoworldnews.com/2025/08/256006/moroccos-digital-currency-revolution-expert-analysis-of-the-e-dirham-initiative/)

### Tertiary (General Reference)
- [Wafacash Official](https://www.wafacash.com/en/payment-0)
- [Payzone Shopify App](https://apps.shopify.com/payzone-maroc)
- [Shopify + CMI Guide](https://www.cartdna.com/shopify-payment-methods/cmi-morocco)
- [Morocco Payment Gateway Providers (PayCly)](https://paycly.com/payment-gateway-providers-morocco.php)
- [Payments Startups in Morocco (Tracxn)](https://tracxn.com/d/explore/payments-startups-in-morocco/__Q8IWzsZgKx2sd6F4ItAxTrDGycl8rY70_g3NgjAhzOI/companies)

---

## Data Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Completeness | Medium-High | Covered all major providers; Payzone docs were inaccessible |
| Recency | High | Most sources from 2024-2026 |
| Reliability | High | Mix of official docs, GitHub repos, and reputable news |
| Actionability | High | Code examples, npm packages, and architecture provided |

## Gaps Requiring Further Investigation

1. **Payzone API**: Developer portal timed out; need direct contact for complete docs
2. **Chari BaaS API**: Not publicly available yet; monitor for launch
3. **Orange Money Morocco**: Web Payment API not confirmed for Morocco
4. **CMI callback hash verification**: Exact algorithm not fully documented in open-source packages; may need CMI's official technical documentation
5. **Recurring billing**: None of the Moroccan gateways natively support subscriptions; would need custom implementation with stored tokens
