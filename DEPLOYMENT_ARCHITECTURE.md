# DocuQuery Deployment Architecture

Visual representation of the deployed DocuQuery architecture.

---

## 🏗️ Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER DEVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │             │
│  │   Browser    │  │   Browser    │  │   Browser    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTPS (SSL/TLS)
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
          ↓                                     ↓
┌─────────────────────┐              ┌─────────────────────┐
│   VERCEL (Frontend) │              │  RENDER (Backend)   │
│─────────────────────│              │─────────────────────│
│ • Next.js 14        │              │ • FastAPI           │
│ • React 18          │              │ • Python 3.8+       │
│ • TypeScript        │              │ • Uvicorn           │
│ • Tailwind CSS      │◄────────────►│ • asyncpg           │
│ • Global CDN        │   REST API   │ • Background Tasks  │
│ • Auto-scaling      │   (HTTPS)    │ • Auto-scaling      │
│ • Edge Functions    │              │ • Health Checks     │
└─────────────────────┘              └──────────┬──────────┘
          │                                     │
          │                                     │
          │                          ┌──────────┴──────────┐
          │                          │                     │
          │                          ↓                     ↓
          │              ┌─────────────────────┐ ┌─────────────────────┐
          │              │ SUPABASE (Database) │ │  COHERE (AI API)    │
          │              │─────────────────────│ │─────────────────────│
          │              │ • PostgreSQL 15     │ │ • Embeddings        │
          └─────────────►│ • pgvector          │ │ • Chat API          │
            Auth (JWT)   │ • Row Level Security│ │ • command-a-03-2025 │
                         │ • Storage (S3)      │ │ • embed-english-v3.0│
                         │ • Auth Service      │ └─────────────────────┘
                         │ • Automatic Backups │
                         └─────────────────────┘
```

---

## 🌐 Network Flow

### 1. User Request Flow

```
User Browser
    │
    │ 1. User visits https://your-app.vercel.app
    ↓
Vercel Edge Network (Global CDN)
    │
    │ 2. Serves static assets (HTML, CSS, JS)
    │ 3. Executes server-side rendering (SSR)
    ↓
User receives rendered page
    │
    │ 4. User interacts (login, upload, chat)
    ↓
Frontend makes API call
    │
    │ 5. POST https://your-api.onrender.com/api/...
    │    Headers: Authorization, X-Workspace-ID
    ↓
Render Backend
    │
    │ 6. Validates JWT token
    │ 7. Checks workspace access
    │ 8. Processes request
    ↓
    ├─► Supabase (Database queries)
    │   └─► Returns data
    │
    ├─► Cohere API (Embeddings/Chat)
    │   └─► Returns AI response
    │
    └─► Supabase Storage (File operations)
        └─► Returns file URL
    │
    │ 9. Returns JSON response
    ↓
Frontend receives response
    │
    │ 10. Updates UI
    ↓
User sees result
```

---

## 🔐 Authentication Flow

```
┌──────────────┐
│ User Browser │
└──────┬───────┘
       │ 1. Login request
       ↓
┌──────────────────┐
│ Vercel Frontend  │
└──────┬───────────┘
       │ 2. POST /api/auth/login
       ↓
┌──────────────────┐
│ Render Backend   │
└──────┬───────────┘
       │ 3. Validate credentials
       ↓
┌──────────────────┐
│ Supabase Auth    │
│ • Verify password│
│ • Generate JWT   │
└──────┬───────────┘
       │ 4. Return JWT token
       ↓
┌──────────────────┐
│ Render Backend   │
└──────┬───────────┘
       │ 5. Return token to frontend
       ↓
┌──────────────────┐
│ Vercel Frontend  │
│ • Store in       │
│   localStorage   │
│ • Add to all     │
│   API requests   │
└──────────────────┘
```

---

## 📄 Document Upload Flow

```
User selects file
    │
    ↓
Frontend (Vercel)
    │ 1. Validate file (type, size)
    │ 2. Create FormData
    ↓
POST /api/documents/upload
    │
    ↓
Backend (Render)
    │ 3. Validate request
    │ 4. Upload to Supabase Storage
    ↓
Supabase Storage
    │ 5. Store file
    │ 6. Return file path
    ↓
Backend (Render)
    │ 7. Create document record
    │ 8. Trigger background task
    ↓
Database (Supabase)
    │ 9. Insert document metadata
    ↓
Background Task
    │ 10. Extract text
    │ 11. Chunk text
    │ 12. Generate embeddings (Cohere)
    │ 13. Store chunks with vectors
    ↓
Database (Supabase)
    │ 14. Insert document_chunks
    ↓
Processing complete
```

---

## 💬 Chat Query Flow

```
User types question
    │
    ↓
Frontend (Vercel)
    │ 1. Send query
    ↓
POST /api/chat/query
    │
    ↓
Backend (Render)
    │ 2. Generate query embedding
    ↓
Cohere API
    │ 3. Return embedding vector
    ↓
Backend (Render)
    │ 4. Vector similarity search
    ↓
Database (Supabase)
    │ 5. Find top-K similar chunks
    │ 6. Return relevant chunks
    ↓
Backend (Render)
    │ 7. Build context
    │ 8. Call Cohere Chat API
    ↓
Cohere API
    │ 9. Generate answer
    │ 10. Return response
    ↓
Backend (Render)
    │ 11. Save conversation
    │ 12. Return answer + sources
    ↓
Frontend (Vercel)
    │ 13. Display answer
    ↓
User sees response
```

---

## 🗄️ Data Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Primary Data Store)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database (15+)                │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Relational Tables                         │  │  │
│  │  │  • workspaces                              │  │  │
│  │  │  • workspace_members                       │  │  │
│  │  │  • documents                               │  │  │
│  │  │  • conversations                           │  │  │
│  │  │  • messages                                │  │  │
│  │  │  • query_logs                              │  │  │
│  │  │  • workspace_invitations                   │  │  │
│  │  │  • notifications                           │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Vector Storage (pgvector)                 │  │  │
│  │  │  • document_chunks                         │  │  │
│  │  │    - id                                    │  │  │
│  │  │    - content (TEXT)                        │  │  │
│  │  │    - embedding (VECTOR(1024))              │  │  │
│  │  │    - IVFFlat index for fast search         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Supabase Storage (S3-compatible)         │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Bucket: documents                         │  │  │
│  │  │  • PDF files                               │  │  │
│  │  │  • DOCX files                              │  │  │
│  │  │  • TXT files                               │  │  │
│  │  │  • MD files                                │  │  │
│  │  │  Path: {workspace_id}/{doc_id}/{filename}  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Supabase Auth                            │  │
│  │  • User authentication                           │  │
│  │  • JWT token generation                          │  │
│  │  • Session management                            │  │
│  │  • Password hashing                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                          │
└─────────────────────────────────────────────────────────┘
                         │
                         │ git push
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  GITHUB REPOSITORY                      │
│  • Source code                                          │
│  • Version control                                      │
│  • Collaboration                                        │
└─────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ↓                             ↓
┌──────────────────────┐    ┌──────────────────────┐
│  VERCEL (Frontend)   │    │  RENDER (Backend)    │
│──────────────────────│    │──────────────────────│
│ 1. Detect push       │    │ 1. Detect push       │
│ 2. Clone repo        │    │ 2. Clone repo        │
│ 3. Install deps      │    │ 3. Install deps      │
│ 4. Build Next.js     │    │ 4. Start server      │
│ 5. Deploy to CDN     │    │ 5. Health check      │
│ 6. Invalidate cache  │    │ 6. Route traffic     │
└──────────────────────┘    └──────────────────────┘
          │                             │
          │                             │
          ↓                             ↓
┌──────────────────────┐    ┌──────────────────────┐
│  PRODUCTION          │    │  PRODUCTION          │
│  (Global CDN)        │    │  (Cloud Instance)    │
└──────────────────────┘    └──────────────────────┘
```

---

## 📊 Scaling Strategy

### Horizontal Scaling

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
   Instance 1       Instance 2       Instance 3
   (Backend)        (Backend)        (Backend)
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ↓
                  Database Pool
                         │
                         ↓
                  Supabase Database
```

### Vertical Scaling

```
Free Tier → Starter → Professional → Enterprise
  (512MB)   (2GB)      (4GB)          (8GB+)
```

---

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                              │
│  • HTTPS/TLS encryption                                 │
│  • SSL certificates (auto-generated)                    │
│  • DDoS protection (Vercel/Render)                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Application Security                          │
│  • JWT authentication                                   │
│  • CORS configuration                                   │
│  • Input validation                                     │
│  • Rate limiting (future)                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Database Security                             │
│  • Row Level Security (RLS)                             │
│  • Workspace isolation                                  │
│  • Encrypted at rest                                    │
│  • Encrypted in transit                                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Data Security                                 │
│  • Environment variables                                │
│  • Secret management                                    │
│  • No sensitive data in code                            │
│  • Regular backups                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│                    MONITORING STACK                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Vercel Analytics                                │  │
│  │  • Page load times                               │  │
│  │  • Core Web Vitals                               │  │
│  │  • Error rates                                   │  │
│  │  • User geography                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Render Metrics                                  │  │
│  │  • CPU usage                                     │  │
│  │  • Memory usage                                  │  │
│  │  • Response times                                │  │
│  │  • Error logs                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase Monitoring                             │  │
│  │  • Database connections                          │  │
│  │  • Query performance                             │  │
│  │  • Storage usage                                 │  │
│  │  • API requests                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🌍 Global Distribution

```
                    ┌─────────────┐
                    │   Vercel    │
                    │  Global CDN │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌─────────┐        ┌─────────┐       ┌─────────┐
   │ US West │        │ Europe  │       │ Asia    │
   │ Edge    │        │ Edge    │       │ Edge    │
   └─────────┘        └─────────┘       └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │   Render    │
                    │   Backend   │
                    │  (US West)  │
                    └──────┬──────┘
                           │
                           ↓
                    ┌─────────────┐
                    │  Supabase   │
                    │  Database   │
                    │  (US East)  │
                    └─────────────┘
```

---

**This architecture provides**:
- ✅ High availability
- ✅ Global performance
- ✅ Automatic scaling
- ✅ Security at every layer
- ✅ Easy monitoring
- ✅ Cost-effective deployment
