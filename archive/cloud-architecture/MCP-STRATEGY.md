# Cloud Architecture Strategy - MCP Server Approach

> **Priority:** 🔵 FUTURE
> **Dependencies:** Stable services layer (layer 09)

## Original Thought Stream

```
clouflare headless api endpoints lamda functons ? 
- for accessing the supabase, this cloudfunction could make use of 
  the services that we are defining in the 09-services stage.
- the cloudflare headless server shall use the same repo in 09 as package
- and hence expose itself as mcp server
```

## Crystallized Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Consumers                                 │
├─────────────────────────────────────────────────────────────────┤
│  AI IDE (Cursor/Windsurf)  │  Admin Panel  │  Public Frontend   │
│         ↓                  │       ↓        │        ↓           │
│    MCP Protocol            │   Direct Use   │   Direct Use       │
└─────────────┬──────────────┴───────┬────────┴────────┬──────────┘
              │                      │                 │
              ▼                      ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Cloudflare Workers (Edge)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MCP Server Wrapper                          │    │
│  │  - Exposes services as MCP tools                        │    │
│  │  - JSON-RPC over HTTP                                   │    │
│  │  - Auth/rate limiting at edge                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 09-services Package (NPM)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ heritage-    │ │ events       │ │ analytics    │            │
│  │ sites.service│ │ .service     │ │ .service     │            │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌──────────────────────┐                          │
│              │   database-client    │                          │
│              │   (abstraction)      │                          │
│              └──────────┬───────────┘                          │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │      Supabase        │
              │   (PostgreSQL)       │
              └──────────────────────┘
```

## MCP Tool Mapping

Each service method becomes an MCP tool:

```typescript
// MCP Tool Definition Example
{
  name: "heritage_sites_get_all",
  description: "Get all heritage sites with optional filters",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["draft", "published", "archived"] },
      palika_id: { type: "string" },
      category: { type: "string" },
      page: { type: "number" },
      limit: { type: "number" }
    }
  }
}
```

## Why This Architecture?

### AI-First Development
> "ai first approach - not literally - cuz first comes the architecture, only then whatever first it is!"

1. **Services first** → Stable, tested business logic
2. **MCP wrapper second** → AI tooling layer on top
3. **Cloud deployment third** → Scale when needed

### Package Reuse
The same `@nepal-tourism/services` package used by:
- Admin panel (direct import)
- Public website (direct import)  
- MCP server (wrapped as tools)
- Future mobile app (via API)

## Implementation Phases

### Phase 1: Package Extraction (Layer 09)
```
09-services/
├── src/
│   ├── services/           # Current 08-admin-panel/services/
│   ├── mcp/               # MCP tool wrappers
│   └── index.ts           # Package exports
├── package.json           # @nepal-tourism/services
└── tsconfig.json
```

### Phase 2: MCP Server
```typescript
// mcp/heritage-sites.tools.ts
export const heritageSitesTools: MCPTool[] = [
  {
    name: "heritage_sites_create",
    handler: async (params) => {
      const service = createHeritageSitesService(db)
      return service.create(params)
    }
  },
  // ... other tools
]
```

### Phase 3: Cloudflare Deployment
```
cloudflare-mcp/
├── src/
│   └── worker.ts          # Cloudflare Worker entry
├── wrangler.toml          # Cloudflare config
└── package.json           # Depends on @nepal-tourism/services
```

## Questions to Resolve

1. **MCP Protocol Version** - Which spec version? (likely latest stable)
2. **Auth Strategy** - API keys? JWT? Supabase auth pass-through?
3. **Rate Limiting** - Per-tool? Per-user? Global?
4. **Caching** - Which queries to cache at edge?

## Not Now

This is **future architecture**. Current priority:
1. Fix failing tests ✓
2. Stabilize services layer ✓
3. Then consider cloud deployment

---

## Reference: Original Stream
> "the frontend can use the same package independent of the cloud mcp apis"
> "maybe we will, but we don't intend on using the cloud apis just yet, we continue using the package we develop here"

**Decision:** Services package first, cloud MCP later. ✓
