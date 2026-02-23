# Sprint 0: Foundation — Project Setup & Architecture

**Start Date:** February 22, 2026
**Status:** In Progress
**Goal:** Transform Diyafa clone into Diyafa catering platform foundation

---

## Completed Tasks

### Research Phase
- [x] Global catering SaaS market research (76+ sources)
- [x] Morocco catering market intelligence ($2.1-2.9B TAM, zero competition)
- [x] Competitor analysis (ezCater, RSVPify, CaterTrax, Caterease, Tripleseat)
- [x] Brand naming (48 names generated, "Diyafa" selected)
- [x] Technical architecture design (2,323 lines, 19 new tables)
- [x] Revenue model design (hybrid: SaaS + commission)

### Repository Setup
- [x] Created GitHub repo: github.com/cybertech1one/cateringsaas
- [x] Cloned Diyafa codebase (standalone, no shared dependencies)
- [x] Created CLAUDE.md (project guide with constitutional principles)
- [x] Created README.md (branded for Diyafa)
- [x] Updated package.json (name: diyafa, version: 1.0.0)
- [x] Created progress tracking system

### In Progress
- [ ] Create .gitignore (exclude sensitive files)
- [ ] Database backup of Diyafa (safety net)
- [ ] Strip Diyafa-specific code (QR codes, KDS, loyalty, delivery)
- [ ] Rebrand all UI references (Diyafa → Diyafa)
- [ ] Create organization/multi-tenant database schema
- [ ] Set up org-based RLS policies
- [ ] Create role hierarchy (super_admin, org_owner, admin, manager, staff)
- [ ] Initial commit and push

---

## Sprint 0 Architecture Decisions

### ADR-001: Phased Hybrid Model
- **Decision**: SaaS-first (tools for caterers), marketplace later
- **Rationale**: Avoids chicken-and-egg; build supply before demand
- **Phase 1**: Caterer tools (Month 1-6)
- **Phase 2**: Client marketplace (Month 6-12)

### ADR-002: Organization-First Multi-Tenancy
- **Decision**: Every caterer/venue/hotel = one "organization"
- **Rationale**: Clean RLS, scalable, supports team roles
- **Implementation**: `organizations` table, `org_members` join table, RLS on org_id

### ADR-003: Event Lifecycle State Machine
- **Decision**: 12-state lifecycle (INQUIRY → SETTLED)
- **Rationale**: Catering is fundamentally different from food ordering
- **States**: inquiry, quote_sent, quote_revised, quote_accepted, deposit_pending, deposit_received, confirmed, in_preparation, in_execution, completed, settlement_pending, settled

### ADR-004: COD + Milestone Payments
- **Decision**: Support COD, bank transfer, CMI with milestone tracking
- **Rationale**: 74% of Morocco operates on cash
- **Implementation**: payment_milestones table, configurable schedules (30/50/20)

### ADR-005: WhatsApp-Native Communication
- **Decision**: WhatsApp Business API as primary channel
- **Rationale**: Near-universal usage in Morocco (~30M users)
- **Implementation**: 360dialog or MessageBird integration

---

## Research Documents
- `research/2026-02-22-global-catering-saas-market-research.md`
- `research/2026-02-22-morocco-catering-market-intelligence.md`
- `research/2026-02-22-catering-saas-master-research.md`
- `docs/plans/2026-02-22-catering-saas-platform-architecture.md`
