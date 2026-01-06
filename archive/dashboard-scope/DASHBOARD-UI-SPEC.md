# Dashboard UI Specification

> **Purpose:** Machine-readable spec for AI-assisted UI generation (Stitch.io, v0, etc.)
> **Version:** 0.1.0
> **Last Updated:** 2026-01-05

---

## Overview

This document defines the admin dashboard structure for Nepal's Digital Tourism Infrastructure. It serves dual purposes:

1. **Human-readable** - Explains what, why, and for whom
2. **Machine-readable** - JSON schema that AI tools can consume to generate UI

As development proceeds, add new data nodes to the JSON. The AI tool regenerates UI from the updated spec.

---

## Stakeholder-View Matrix

| Role | Scope | Primary Concern | Dashboard Focus |
|------|-------|-----------------|-----------------|
| `super_admin` | All Palikas | System health, adoption | National overview, Palika comparison |
| `palika_admin` | Own Palika | Content performance, engagement | Local metrics, pending actions |
| `moderator` | Own Palika | Content quality | Content queue, recent activity |
| `support` | Own Palika | User issues | Read-only metrics, ticket queue |

---

## Data Nodes

### Availability Legend

```
[x] Implemented - analytics.service.ts provides this
[ ] Planned - Schema exists, service method needed
[~] Partial - Exists but incomplete
```

### Node Categories

1. **Content Metrics** - What content exists
2. **Engagement Metrics** - How content performs
3. **Operational Metrics** - Admin activity health
4. **Business Metrics** - Marketplace performance (future)

---

## JSON Specification

```json
{
  "$schema": "dashboard-ui-spec/0.1.0",
  "meta": {
    "project": "Nepal Digital Tourism Infrastructure",
    "generatedFor": ["stitch.io", "v0.dev", "claude"],
    "lastUpdated": "2026-01-05"
  },

  "views": {
    "palika_dashboard": {
      "title": "Palika Dashboard",
      "description": "Primary view for palika_admin and moderator roles",
      "accessRoles": ["super_admin", "palika_admin", "moderator"],
      "scopeFilter": "palika_id",

      "layout": {
        "type": "grid",
        "sections": [
          {
            "id": "hero_metrics",
            "title": "At a Glance",
            "position": "top",
            "columns": 4,
            "purpose": "Immediate health check - answer 'Is my Palika active?'"
          },
          {
            "id": "content_health",
            "title": "Content Status",
            "position": "left",
            "width": "60%",
            "purpose": "Content pipeline visibility - drafts, published, stale"
          },
          {
            "id": "pending_actions",
            "title": "Needs Attention",
            "position": "right",
            "width": "40%",
            "purpose": "Action items requiring admin intervention"
          },
          {
            "id": "trends",
            "title": "This Period",
            "position": "bottom",
            "purpose": "Week-over-week or month-over-month comparison"
          }
        ]
      },

      "dataNodes": [
        {
          "id": "heritage_sites_total",
          "label": "Heritage Sites",
          "section": "hero_metrics",
          "displayType": "stat_card",
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "heritage_sites.total"
          },
          "availability": "implemented",
          "rationale": "Primary content type - key indicator of Palika engagement"
        },
        {
          "id": "heritage_sites_published",
          "label": "Published Sites",
          "section": "content_health",
          "displayType": "progress_bar",
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "heritage_sites.published",
            "denominator": "heritage_sites.total"
          },
          "availability": "implemented",
          "rationale": "Publishing rate indicates content completion"
        },
        {
          "id": "heritage_sites_draft",
          "label": "Draft Sites",
          "section": "content_health",
          "displayType": "count_with_action",
          "action": {
            "label": "Review Drafts",
            "route": "/content/heritage-sites?status=draft"
          },
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "heritage_sites.draft"
          },
          "availability": "implemented",
          "rationale": "High draft count = work in progress or abandoned content"
        },
        {
          "id": "events_total",
          "label": "Events",
          "section": "hero_metrics",
          "displayType": "stat_card",
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "events.total"
          },
          "availability": "implemented"
        },
        {
          "id": "events_upcoming",
          "label": "Upcoming Events",
          "section": "content_health",
          "displayType": "count_with_action",
          "action": {
            "label": "View Calendar",
            "route": "/events/calendar"
          },
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "events.upcoming"
          },
          "availability": "implemented",
          "rationale": "Zero upcoming events = calendar needs attention"
        },
        {
          "id": "blog_posts_total",
          "label": "Blog Posts",
          "section": "hero_metrics",
          "displayType": "stat_card",
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "blog_posts.total"
          },
          "availability": "implemented"
        },
        {
          "id": "total_views",
          "label": "Total Views",
          "section": "hero_metrics",
          "displayType": "stat_card",
          "format": "compact_number",
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "engagement.total_views"
          },
          "availability": "implemented",
          "rationale": "Primary engagement metric - is content being discovered?"
        },
        {
          "id": "businesses_pending",
          "label": "Businesses Pending Verification",
          "section": "pending_actions",
          "displayType": "alert_count",
          "severity": "warning",
          "action": {
            "label": "Review",
            "route": "/businesses?status=pending"
          },
          "source": {
            "service": "analytics.getDashboardStats",
            "path": "businesses.pending"
          },
          "availability": "implemented",
          "rationale": "Pending verifications block business owners"
        },
        {
          "id": "reviews_pending",
          "label": "Reviews Awaiting Moderation",
          "section": "pending_actions",
          "displayType": "alert_count",
          "severity": "info",
          "action": {
            "label": "Moderate",
            "route": "/reviews?approved=false"
          },
          "source": {
            "service": "analytics.getPendingReviews",
            "path": "count"
          },
          "availability": "planned",
          "schemaSupport": "reviews.is_approved field exists",
          "rationale": "User-generated content needs moderation"
        },
        {
          "id": "sos_active",
          "label": "Active SOS Requests",
          "section": "pending_actions",
          "displayType": "alert_count",
          "severity": "critical",
          "action": {
            "label": "Respond",
            "route": "/sos?status=received,assigned,in_progress"
          },
          "source": {
            "service": "analytics.getActiveSosCount",
            "path": "count"
          },
          "availability": "planned",
          "schemaSupport": "sos_requests table exists with status field",
          "rationale": "Emergency requests are time-critical"
        },
        {
          "id": "content_freshness",
          "label": "Stale Content",
          "section": "content_health",
          "displayType": "warning_badge",
          "threshold": {
            "warn": 5,
            "critical": 20
          },
          "source": {
            "service": "analytics.getContentFreshnessReport",
            "path": "stale_content"
          },
          "availability": "implemented",
          "rationale": "Content not updated in 6+ months may be outdated"
        },
        {
          "id": "views_trend",
          "label": "Views This Week vs Last Week",
          "section": "trends",
          "displayType": "comparison_chart",
          "chartType": "sparkline_with_delta",
          "source": {
            "service": "analytics.getViewsTrend",
            "path": "weekly_comparison"
          },
          "availability": "planned",
          "schemaSupport": "view_count exists, need time-series aggregation",
          "rationale": "Trend direction more actionable than absolute numbers"
        },
        {
          "id": "top_content",
          "label": "Top Performing Content",
          "section": "trends",
          "displayType": "ranked_list",
          "limit": 5,
          "source": {
            "service": "analytics.getTopContent",
            "params": ["heritage_site", 5, "palika_id"]
          },
          "availability": "implemented",
          "rationale": "Identifies what resonates with visitors"
        }
      ]
    },

    "national_dashboard": {
      "title": "National Overview",
      "description": "Cross-Palika view for super_admin and provincial coordinators",
      "accessRoles": ["super_admin"],
      "scopeFilter": null,

      "layout": {
        "type": "grid",
        "sections": [
          {
            "id": "adoption_metrics",
            "title": "Platform Adoption",
            "position": "top"
          },
          {
            "id": "palika_comparison",
            "title": "Palika Performance",
            "position": "center"
          },
          {
            "id": "system_health",
            "title": "System Status",
            "position": "bottom"
          }
        ]
      },

      "dataNodes": [
        {
          "id": "palikas_active",
          "label": "Active Palikas",
          "section": "adoption_metrics",
          "displayType": "stat_card_with_total",
          "source": {
            "service": "analytics.getPalikaActivityReport",
            "aggregation": "count_where",
            "condition": "is_active === true"
          },
          "availability": "implemented",
          "rationale": "Adoption rate is key success metric"
        },
        {
          "id": "palikas_inactive",
          "label": "Inactive Palikas (30+ days)",
          "section": "adoption_metrics",
          "displayType": "alert_count",
          "severity": "warning",
          "source": {
            "service": "analytics.getPalikaActivityReport",
            "aggregation": "count_where",
            "condition": "is_active === false"
          },
          "availability": "implemented",
          "rationale": "Inactive Palikas may need outreach or support"
        },
        {
          "id": "palika_leaderboard",
          "label": "Top Palikas by Content",
          "section": "palika_comparison",
          "displayType": "data_table",
          "columns": ["palika_name", "heritage_sites_count", "events_count", "last_activity"],
          "sortable": true,
          "source": {
            "service": "analytics.getPalikaActivityReport",
            "path": "full_array"
          },
          "availability": "implemented"
        }
      ]
    }
  },

  "components": {
    "stat_card": {
      "description": "Single metric with large number and label",
      "props": ["value", "label", "icon?", "trend?"],
      "example": "12 Heritage Sites"
    },
    "progress_bar": {
      "description": "Numerator/denominator as visual bar",
      "props": ["value", "total", "label"],
      "example": "8/12 Published (67%)"
    },
    "count_with_action": {
      "description": "Count badge with action button",
      "props": ["count", "label", "actionLabel", "actionRoute"],
      "example": "4 Drafts [Review]"
    },
    "alert_count": {
      "description": "Attention-grabbing count for pending items",
      "props": ["count", "label", "severity", "actionRoute"],
      "severityColors": {
        "info": "blue",
        "warning": "yellow",
        "critical": "red"
      }
    },
    "ranked_list": {
      "description": "Numbered list of top items",
      "props": ["items", "limit", "labelField", "valueField"],
      "example": "1. Pashupatinath (12,345 views)"
    },
    "comparison_chart": {
      "description": "Two-period comparison with delta",
      "props": ["currentValue", "previousValue", "periodLabel"],
      "example": "847 this week (+17%)"
    },
    "data_table": {
      "description": "Sortable table for detailed data",
      "props": ["columns", "data", "sortable", "pagination?"]
    }
  },

  "dataSourceMapping": {
    "implemented": [
      "analytics.getDashboardStats(palikaId?)",
      "analytics.getContentAnalytics(entityType, filters)",
      "analytics.getTopContent(entityType, limit, palikaId?)",
      "analytics.getContentFreshnessReport(palikaId?)",
      "analytics.getPalikaActivityReport()",
      "analytics.getBusinessInquiryAnalytics(businessId?, palikaId?)",
      "analytics.getUserEngagementMetrics(palikaId?)",
      "analytics.generateMonthlyReport(palikaId, year, month)"
    ],
    "planned": [
      "analytics.getPendingReviews(palikaId?) - needs: count reviews where is_approved=false",
      "analytics.getActiveSosCount(palikaId?) - needs: count sos_requests where status in (received, assigned, in_progress)",
      "analytics.getViewsTrend(palikaId?, period) - needs: time-series aggregation of view_count"
    ]
  }
  ,
  "securityNotes": {
  "rlsVerified": "2026-01-05",
  "roleCapabilities": {
    "super_admin": "Full access all Palikas",
    "palika_admin": "Full access own Palika",
    "moderator": "Read all Palika content, write own blog posts only",
    "support": "Read-only own Palika"
  },
  "blogPostsBehavior": "Moderators see all Palika posts in dashboard counts, but can only edit their own"
}
}
```

---

## Implementation Notes

### For AI UI Generators

When consuming this spec:

1. **Respect `accessRoles`** - Filter views by logged-in user role
2. **Apply `scopeFilter`** - palika_admin sees only their Palika data
3. **Check `availability`** - Gray out or hide `planned` nodes until implemented
4. **Use `severity`** - Color-code alerts appropriately
5. **Follow `layout.sections`** - Position components as specified

### For Developers

When adding new data nodes:

1. Add to `dataNodes` array in appropriate view
2. Set `availability: "planned"` with `schemaSupport` note
3. Implement service method
4. Update `availability: "implemented"`
5. Regenerate UI

### Extending the Spec

```json
{
  "id": "new_metric_id",
  "label": "Human-readable label",
  "section": "which_section",
  "displayType": "component_type",
  "source": {
    "service": "analytics.methodName",
    "path": "response.path.to.value"
  },
  "availability": "planned|implemented",
  "rationale": "Why this metric matters"
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-05 | Initial spec with palika_dashboard and national_dashboard views |

---

## Related Documents

- `DASHBOARD-REQUIREMENTS.md` - Business requirements (grounded)
- `../rbac/RBAC-CONCERNS.md` - Access control considerations
- `../../08-admin-panel/services/analytics.service.ts` - Implementation source
