# Diyafa tRPC Router Architecture

## Router Mapping: FeastQR → Diyafa

### Routers to KEEP & EVOLVE
| FeastQR Router | Diyafa Router | Changes |
|---------------|--------------|---------|
| `auth` | `auth` | Add org context, role-based middleware |
| `languages` | `languages` | Keep as-is |
| `theme` | `theme` | Adapt for caterer profiles |
| `staff` | `staff` | Add org-scoped staff + event assignments |
| `reviews` | `reviews` | Multi-dimensional ratings (food/service/value/presentation) |
| `analytics` | `analytics` | New catering-specific metrics |
| `notifications` | `notifications` | WhatsApp-first priority |
| `marketing` | `marketing` | Adapt for catering campaigns |
| `ai` | `ai` | Catering-specific AI (menu gen, quote gen, demand forecast) |
| `crm` | `crm` | Full CRM with client profiles, segments, history |
| `payments` | `payments` | Milestone payments, COD, CMI, bank transfer |

### Routers to REMOVE
| Router | Reason |
|--------|--------|
| `menus/` (menu CRUD) | Replace with catering menus |
| `menus/publishing` | Replace with org profile management |
| `menus/management` | Replace with catering menu management |
| `orders` | Replace with events/bookings |
| `kitchen` | KDS not applicable |
| `loyalty` | Replace with CRM loyalty tracking |
| `directory` | Replace with marketplace browse |
| `affiliates` | Phase 2 |
| `promotions` | Merge into marketing |
| `delivery` | Not applicable to catering |
| `drivers` | Not applicable |
| `catering` | Old catering module - replace with new |
| `restaurants` | Replace with organizations |

### NEW Routers for Diyafa

#### 1. `organizations` — Core multi-tenant router
```typescript
// CRUD
organizations.create          // Create new org (with onboarding)
organizations.getById         // Get org by ID
organizations.getBySlug       // Get org by slug (public profile)
organizations.update          // Update org details
organizations.updateSettings  // Update org settings (JSON)
organizations.uploadLogo      // Upload logo to Supabase Storage
organizations.uploadCover     // Upload cover image
organizations.delete          // Soft delete org

// Members
organizations.getMembers      // List org members
organizations.inviteMember    // Invite by email
organizations.updateMemberRole // Change role
organizations.removeMember    // Remove member
organizations.acceptInvitation // Accept invite

// Public
organizations.browse          // Marketplace browse (city, cuisine, type)
organizations.getPublicProfile // Public caterer page
organizations.search          // Search caterers
organizations.getFeatured     // Featured caterers for homepage
```

#### 2. `events` — Event lifecycle management
```typescript
// CRUD
events.create                 // Create new event (from inquiry)
events.getById                // Get event details
events.list                   // List events (with filters)
events.update                 // Update event details
events.updateStatus           // Transition event state (state machine)

// Calendar
events.getCalendar            // Calendar view (month/week)
events.getUpcoming            // Next 7 days events
events.checkAvailability      // Check date availability

// Client-facing
events.getClientEvents        // Client's events
events.submitInquiry          // Client submits inquiry (public)

// Timeline
events.getTimeline            // Get event prep timeline
events.addTimelineItem        // Add timeline item
events.updateTimelineItem     // Update timeline status
```

#### 3. `quotes` — Quote builder & management
```typescript
quotes.create                 // Create new quote for event
quotes.getById                // Get quote details
quotes.update                 // Update quote items/pricing
quotes.send                   // Send quote to client (email + WhatsApp)
quotes.revise                 // Create new version
quotes.accept                 // Client accepts quote
quotes.reject                 // Client rejects quote
quotes.duplicate              // Duplicate quote as template
quotes.listByEvent            // All quotes for an event
quotes.listAll                // All quotes (with filters)
quotes.generatePDF            // Generate PDF quote
```

#### 4. `cateringMenus` — Catering menu management
```typescript
cateringMenus.create          // Create catering menu
cateringMenus.getById         // Get menu details
cateringMenus.list            // List org's menus
cateringMenus.update          // Update menu
cateringMenus.delete          // Delete menu
cateringMenus.duplicate       // Duplicate menu

// Items
cateringMenus.addItem         // Add item to menu
cateringMenus.updateItem      // Update item
cateringMenus.removeItem      // Remove item
cateringMenus.reorderItems    // Reorder items

// Public
cateringMenus.getPublicMenus  // Public menus for caterer profile

// AI
cateringMenus.aiSuggest       // AI suggest menu for event type
cateringMenus.aiTranslate     // Translate menu items (EN/FR/AR)
```

#### 5. `finances` — Financial management
```typescript
// Payment milestones
finances.createMilestone      // Create payment milestone
finances.updateMilestone      // Update milestone status
finances.getMilestonesByEvent  // Get milestones for event
finances.markAsPaid           // Mark milestone as paid (COD/transfer confirmation)

// Invoices
finances.createInvoice        // Generate invoice
finances.getInvoice           // Get invoice
finances.listInvoices         // List all invoices
finances.sendInvoice          // Send invoice (email + WhatsApp)
finances.generateInvoicePDF   // Generate PDF invoice
finances.markInvoicePaid      // Mark invoice as paid

// Reports
finances.getRevenueOverview   // Revenue dashboard data
finances.getDailyRevenue      // Daily revenue chart
finances.getMonthlyRevenue    // Monthly trends
finances.getExpenseBreakdown  // Expense categories
finances.getProfitLoss        // P&L statement
```

#### 6. `clients` — CRM for client management
```typescript
clients.create                // Create client profile
clients.getById               // Get client details
clients.list                  // List all clients (with search/filter)
clients.update                // Update client info
clients.addNote               // Add note to client
clients.addTag                // Tag client (VIP, corporate, repeat)
clients.getEventHistory       // Client's past events
clients.getSegments           // Client segments
clients.exportCSV             // Export client data
```

#### 7. `equipment` — Equipment tracking
```typescript
equipment.create              // Add equipment to inventory
equipment.list                // List all equipment
equipment.update              // Update equipment details
equipment.delete              // Remove equipment
equipment.allocateToEvent     // Reserve equipment for event
equipment.returnFromEvent     // Mark as returned
equipment.getByEvent          // Equipment for specific event
equipment.getLowStock          // Low stock alerts
```

#### 8. `staffScheduling` — Staff scheduling
```typescript
staffScheduling.assignToEvent      // Assign staff to event
staffScheduling.removeFromEvent    // Remove assignment
staffScheduling.getByEvent         // Staff for an event
staffScheduling.getByStaff         // Events for a staff member
staffScheduling.getScheduleCalendar // Staff calendar view
staffScheduling.checkAvailability  // Check staff availability
staffScheduling.updateAssignment   // Update role/status
staffScheduling.checkIn            // Staff check-in at event
staffScheduling.checkOut           // Staff check-out
```

#### 9. `messages` — In-app messaging
```typescript
messages.send                 // Send message (org ↔ client)
messages.getByEvent           // Messages for an event
messages.markAsRead           // Mark messages read
messages.getUnreadCount       // Unread notification count
messages.sendWhatsApp         // Send via WhatsApp Business API
```

#### 10. `marketplace` — Public marketplace
```typescript
marketplace.browse            // Browse caterers (with filters)
marketplace.search            // Full-text search
marketplace.getCities         // Available cities
marketplace.getCuisines       // Available cuisines
marketplace.getEventTypes     // Event type options
marketplace.getFeatured       // Featured caterers
marketplace.getCatererProfile // Full public profile
marketplace.submitInquiry     // Submit inquiry (guest or registered)
```

#### 11. `admin` — Super admin (platform level)
```typescript
admin.getDashboard            // Platform metrics
admin.listOrganizations       // All orgs with stats
admin.getOrganization         // Org details
admin.verifyOrganization      // Verify/unverify
admin.suspendOrganization     // Suspend org
admin.listUsers               // All users
admin.getSystemHealth         // System monitoring
admin.getFinancials           // Platform financials (GMV, commission)
admin.setFeatureFlag          // Feature flags
admin.moderateReview          // Content moderation
```

## Router Count Summary
| Category | Count | Routers |
|----------|-------|---------|
| Kept & Evolved | 11 | auth, languages, theme, staff, reviews, analytics, notifications, marketing, ai, crm, payments |
| New | 11 | organizations, events, quotes, cateringMenus, finances, clients, equipment, staffScheduling, messages, marketplace, admin |
| **Total** | **22** | |

## Middleware Stack
```typescript
// Public procedures (no auth required)
publicProcedure

// Authenticated procedures (user must be logged in)
privateProcedure  // existing

// Org-scoped procedures (user must be org member)
orgProcedure      // NEW: validates org_id + membership

// Admin-scoped (user must be org admin+)
orgAdminProcedure // NEW: validates admin/owner role

// Super admin (platform level)
superAdminProcedure // NEW: validates super_admin role
```
