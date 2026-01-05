# Dashboard Scope - Palika Admin Requirements

> **Priority:** 🟡 SHORT-TERM
> **Stakeholder:** Palika administrators ("Balika dashboard")

## Original Thought Stream

```
- the admins, their dashboard
- what the numbers mean
- to the balika dashboard
  - what matters
  - the bundle's scope?
    - what should be
      - marketplace
      - event
      - bla bla bla from the docs
        - note this is serious
        - and hence I must remain vague for now lest I'll infer something else
```

## The Right Question

> "What numbers matter to a Palika administrator?"

Not all metrics are equal. A Palika admin cares about **their jurisdiction's tourism health**.

## Dashboard Tiers

### Tier 1: At-a-Glance (Hero Metrics)

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR PALIKA TODAY                         │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   12        │    847      │    5        │    23            │
│ Heritage    │  Monthly    │  Pending    │  Business        │
│ Sites       │  Views      │  Reviews    │  Inquiries       │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

These answer: "Is my Palika visible? Is there engagement?"

### Tier 2: Content Health

| Metric | Meaning | Action Trigger |
|--------|---------|----------------|
| Published sites | Active content | Low = add more |
| Draft sites | Work in progress | High = publish or delete |
| Sites without images | Quality gap | High = upload images |
| Sites with outdated info | Freshness | > 6 months = review |
| Average rating | Visitor satisfaction | < 3.5 = investigate |

### Tier 3: Engagement Trends

```
Views This Week    ████████████████░░░░ 847
Views Last Week    ██████████████░░░░░░ 723
                                       +17% ↑
```

### Tier 4: Business Impact (If Marketplace Enabled)

| Metric | Meaning |
|--------|---------|
| Active businesses | Local economy participation |
| Inquiry conversion | Leads → bookings |
| Revenue generated | Economic impact |

## What's In Scope for MVP Dashboard?

Based on System Operations document use cases:

### Must Have (Week 1)
- [ ] Total heritage sites (by status)
- [ ] Total events (upcoming/past)
- [ ] Total blog posts (by status)
- [ ] View counts summary
- [ ] Pending content requiring review

### Should Have (Week 2-3)
- [ ] Content published this month
- [ ] Top 5 viewed items
- [ ] Recent activity log
- [ ] User-submitted reviews pending moderation

### Could Have (Later)
- [ ] Business inquiries (when marketplace launches)
- [ ] Revenue metrics (when monetization launches)
- [ ] Comparative analytics (vs other Palikas)
- [ ] Export reports (PDF/Excel)

## Services Already Support This

**Grounded 2026-01-05** - Verified against `08-admin-panel/services/analytics.service.ts`

```typescript
// Actual DashboardStats interface (types.ts)
interface DashboardStats {
  heritage_sites: { total, published, draft, featured }
  events: { total, upcoming, past, festivals }
  blog_posts: { total, published, draft }
  businesses: { total, verified, pending }
  users: { total, residents, tourists, business_owners }
  engagement: { total_views, qr_scans, inquiries, reviews }
}

// ✅ Implemented
analytics.getDashboardStats(palikaId?)
analytics.getContentAnalytics(entityType, filters)
analytics.getTopContent(entityType, limit, palikaId?)
analytics.getContentFreshnessReport(palikaId?)
analytics.getPalikaActivityReport()
analytics.getBusinessInquiryAnalytics(businessId?, palikaId?)
analytics.getUserEngagementMetrics(palikaId?)
analytics.generateMonthlyReport(palikaId, year, month)

// ❌ Not implemented (gaps)
- Pending reviews moderation (reviews.is_approved = false)
- SOS request metrics (sos_requests table exists)
- Time-series trends (need aggregation by period)
- QR scan tracking (no table)
```

## Dashboard Layout Suggestion

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome, [Admin Name]              [Language: EN ▼]        │
│  [Palika Name] Dashboard                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 12      │ │ 8       │ │ 5       │ │ 847     │          │
│  │ Sites   │ │ Events  │ │ Posts   │ │ Views   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ┌─────────────────────────┐ ┌────────────────────────┐    │
│  │ Recent Activity         │ │ Pending Review         │    │
│  │ • Site updated: ...     │ │ • 3 user reviews       │    │
│  │ • Event published: ...  │ │ • 2 business requests  │    │
│  │ • Blog drafted: ...     │ │                        │    │
│  └─────────────────────────┘ └────────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Views Over Time                                       │  │
│  │ [Simple line chart]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Marketplace Scope (Future)

When you enable marketplace:

```
┌──────────────────────────────────────┐
│ Business Inquiries                    │
├──────────────────────────────────────┤
│ 23 Total  │ 5 New  │ 8 In Progress   │
├──────────────────────────────────────┤
│ Recent:                              │
│ • Hotel booking request (2h ago)     │
│ • Tour guide inquiry (5h ago)        │
│ • Restaurant partnership (1d ago)    │
└──────────────────────────────────────┘
```

## Questions to Resolve

1. **Who sees what?**
   - super_admin → All Palikas
   - palika_admin → Only their Palika
   - moderator → Read-only dashboard?

2. **Time granularity?**
   - Today / This week / This month / Custom?

3. **Comparison baseline?**
   - vs last period?
   - vs provincial average?

4. **Alert thresholds?**
   - "Low activity" warning when < X views?
   - "Pending content" badge when > Y drafts?

---

## Implementation Priority

```
Week 1: Stats cards (getDashboardStats)
Week 2: Activity feed + pending items
Week 3: Charts (getTrafficAnalytics)
Week 4: Polish + accessibility
```

The services are ready. The dashboard is mostly UI work now.
