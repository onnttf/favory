import { createHash, randomUUID } from "node:crypto"
import { writeFileSync } from "node:fs"

function urlHash(url) {
  return createHash("sha256").update(url).digest("hex")
}

function esc(s) {
  return s ? s.replace(/'/g, "''") : ""
}

const now = new Date().toISOString()

// ── Collections (3 levels deep) ───────────────────────────────────────────────
//
//  Development (#3b82f6)
//  ├── Frontend (#60a5fa)
//  │   ├── React Ecosystem (#93c5fd)
//  │   └── CSS & Styling (#c4b5fd)
//  └── Backend (#818cf8)
//      └── Databases (#7c3aed)
//
//  Design (#8b5cf6)
//  └── UI Components (#a78bfa)
//
//  AI & ML (#10b981)
//  ├── Research (#34d399)
//  └── Tools & APIs (#6ee7b7)
//
//  DevOps (#06b6d4)
//  ├── Cloud (#67e8f9)
//  └── CI/CD & IaC (#0891b2)
//
//  Reading List (#ef4444)

const C = {
  // Level 0 — roots
  dev:      randomUUID(),
  design:   randomUUID(),
  ai:       randomUUID(),
  devops:   randomUUID(),
  reading:  randomUUID(),

  // Level 1 — children
  frontend: randomUUID(),   // parent: dev
  backend:  randomUUID(),   // parent: dev
  uicomp:   randomUUID(),   // parent: design
  aiResearch: randomUUID(), // parent: ai
  aiTools:  randomUUID(),   // parent: ai
  cloud:    randomUUID(),   // parent: devops
  cicd:     randomUUID(),   // parent: devops

  // Level 2 — grandchildren
  react:    randomUUID(),   // parent: frontend
  css:      randomUUID(),   // parent: frontend
  databases: randomUUID(),  // parent: backend
}

const collections = [
  // Level 0
  { id: C.dev,      parent: null,       name: "Development",      color: "#3b82f6", sort: 1 },
  { id: C.design,   parent: null,       name: "Design",           color: "#8b5cf6", sort: 2 },
  { id: C.ai,       parent: null,       name: "AI & ML",          color: "#10b981", sort: 3 },
  { id: C.devops,   parent: null,       name: "DevOps",           color: "#06b6d4", sort: 4 },
  { id: C.reading,  parent: null,       name: "Reading List",     color: "#ef4444", sort: 5 },
  // Level 1
  { id: C.frontend, parent: C.dev,      name: "Frontend",         color: "#60a5fa", sort: 6 },
  { id: C.backend,  parent: C.dev,      name: "Backend",          color: "#818cf8", sort: 7 },
  { id: C.uicomp,   parent: C.design,   name: "UI Components",    color: "#a78bfa", sort: 8 },
  { id: C.aiResearch,parent: C.ai,      name: "Research",         color: "#34d399", sort: 9 },
  { id: C.aiTools,  parent: C.ai,       name: "Tools & APIs",     color: "#6ee7b7", sort: 10 },
  { id: C.cloud,    parent: C.devops,   name: "Cloud",            color: "#67e8f9", sort: 11 },
  { id: C.cicd,     parent: C.devops,   name: "CI/CD & IaC",      color: "#0891b2", sort: 12 },
  // Level 2
  { id: C.react,    parent: C.frontend, name: "React Ecosystem",  color: "#93c5fd", sort: 13 },
  { id: C.css,      parent: C.frontend, name: "CSS & Styling",    color: "#c4b5fd", sort: 14 },
  { id: C.databases,parent: C.backend,  name: "Databases",        color: "#7c3aed", sort: 15 },
]

// ── Bookmarks ─────────────────────────────────────────────────────────────────
const raw = [
  // ── Development (root) ──
  { url:"https://github.com",                                             title:"GitHub",                                    desc:"The complete developer platform.",                              tags:["tools","git"],                                col:C.dev },
  { url:"https://stackoverflow.com",                                      title:"Stack Overflow",                            desc:"Where developers learn, share, & build careers.",              tags:["reference","community"],                       col:C.dev },
  { url:"https://developer.mozilla.org/en-US/docs/Web",                   title:"MDN Web Docs",                              desc:"Resources for developers, by developers.",                      tags:["reference","frontend","backend"],               col:C.dev },

  // ── Frontend (level 1, child of Development) ──
  { url:"https://vitejs.dev/guide/",                                      title:"Vite | Getting Started",                    desc:"Next generation front-end tooling.",                            tags:["tools","javascript","frontend"],               col:C.frontend },
  { url:"https://www.typescriptlang.org/docs/",                           title:"TypeScript Documentation",                  desc:"Official TypeScript handbook and reference.",                  tags:["typescript","reference"],                      col:C.frontend },
  { url:"https://nextjs.org/docs",                                        title:"Next.js Documentation",                     desc:"Full-stack React framework docs.",                              tags:["react","typescript","frontend"],               col:C.frontend },
  { url:"https://astro.build/docs/",                                      title:"Astro Docs",                                desc:"Build faster websites with Astro.",                             tags:["frontend","javascript"],                       col:C.frontend },
  { url:"https://svelte.dev/docs",                                        title:"Svelte Docs",                               desc:"Cybernetically enhanced web apps.",                             tags:["frontend","javascript"],                       col:C.frontend },

  // ── React Ecosystem (level 2, child of Frontend) ──
  { url:"https://react.dev",                                              title:"React – The library for web and native UIs",desc:"Official React documentation.",                                tags:["react","javascript","frontend"],               col:C.react },
  { url:"https://tanstack.com/query/latest/docs/framework/react/overview",title:"TanStack Query – React Query Overview",     desc:"Powerful asynchronous state management for React.",             tags:["react","javascript","frontend"],               col:C.react },
  { url:"https://tanstack.com/table/latest",                              title:"TanStack Table",                            desc:"Headless UI for building powerful tables & datagrids.",         tags:["react","javascript","frontend"],               col:C.react },
  { url:"https://zustand-demo.pmnd.rs",                                   title:"Zustand",                                   desc:"A small, fast and scalable state management solution.",         tags:["react","javascript"],                          col:C.react },
  { url:"https://jotai.org",                                              title:"Jotai",                                     desc:"Atomic approach to React state management.",                    tags:["react","javascript"],                          col:C.react },
  { url:"https://www.framer.com/motion/",                                 title:"Framer Motion",                             desc:"A production-ready animation library for React.",               tags:["react","frontend","design"],                   col:C.react },
  { url:"https://react-hook-form.com",                                    title:"React Hook Form",                           desc:"Performant, flexible forms with easy validation.",              tags:["react","frontend"],                            col:C.react },

  // ── CSS & Styling (level 2, child of Frontend) ──
  { url:"https://tailwindcss.com/docs",                                   title:"Tailwind CSS Documentation",                desc:"Utility-first CSS framework documentation.",                    tags:["css","design","frontend"],                     col:C.css },
  { url:"https://cssreference.io",                                        title:"CSS Reference",                             desc:"A free visual guide to CSS.",                                   tags:["css","reference","frontend"],                  col:C.css },
  { url:"https://animista.net",                                           title:"Animista",                                  desc:"CSS animations on demand.",                                     tags:["css","design","frontend"],                     col:C.css },
  { url:"https://www.joshwcomeau.com/css/custom-css-reset/",              title:"A Modern CSS Reset",                        desc:"Josh Comeau's thoughtful CSS reset.",                           tags:["css","frontend"],                              col:C.css },
  { url:"https://every-layout.dev",                                       title:"Every Layout",                              desc:"Relearn how to solve CSS layout problems.",                     tags:["css","design","frontend"],                     col:C.css },
  { url:"https://open-props.style",                                       title:"Open Props",                                desc:"Supercharged CSS variables.",                                   tags:["css","design"],                                col:C.css },

  // ── Backend (level 1, child of Development) ──
  { url:"https://nodejs.org/en/docs",                                     title:"Node.js Documentation",                     desc:"Official Node.js API reference.",                               tags:["javascript","backend","reference"],             col:C.backend },
  { url:"https://bun.sh/docs",                                            title:"Bun Documentation",                         desc:"Bun is a fast JavaScript runtime.",                             tags:["javascript","backend","tools"],                col:C.backend },
  { url:"https://hono.dev",                                               title:"Hono – Web framework for the Edges",        desc:"Small, simple, and ultrafast web framework.",                   tags:["typescript","backend"],                        col:C.backend },
  { url:"https://fastify.dev/docs/latest/",                               title:"Fastify Documentation",                     desc:"Fast and low overhead web framework for Node.js.",              tags:["javascript","backend"],                        col:C.backend },
  { url:"https://trpc.io/docs",                                           title:"tRPC | Documentation",                      desc:"End-to-end typesafe APIs made easy.",                           tags:["typescript","backend","frontend"],              col:C.backend },
  { url:"https://www.prisma.io/docs",                                     title:"Prisma Documentation",                      desc:"Next-generation Node.js and TypeScript ORM.",                   tags:["typescript","backend","database"],              col:C.backend },
  { url:"https://socket.io/docs/v4/",                                     title:"Socket.IO Documentation",                   desc:"Bidirectional event-based communication library.",              tags:["javascript","backend","frontend"],              col:C.backend },
  { url:"https://graphql.org/learn/",                                     title:"GraphQL | Learn",                           desc:"Introduction to GraphQL.",                                      tags:["backend","frontend","reference"],               col:C.backend },

  // ── Databases (level 2, child of Backend) ──
  { url:"https://www.postgresql.org/docs/current/",                       title:"PostgreSQL Documentation",                  desc:"Official PostgreSQL documentation.",                            tags:["database","backend","reference"],               col:C.databases },
  { url:"https://redis.io/docs/",                                         title:"Redis Documentation",                       desc:"In-memory data structure store documentation.",                 tags:["database","backend"],                          col:C.databases },
  { url:"https://www.mongodb.com/docs/",                                  title:"MongoDB Documentation",                     desc:"Official MongoDB documentation.",                               tags:["database","backend"],                          col:C.databases },
  { url:"https://sqlite.org/docs.html",                                   title:"SQLite Documentation",                      desc:"Self-contained, high-reliability SQL database engine.",         tags:["database","backend","reference"],               col:C.databases },
  { url:"https://turso.tech/docs",                                        title:"Turso Documentation",                       desc:"SQLite for production, at the edge.",                           tags:["database","backend","devops"],                  col:C.databases },

  // ── Design (root) ──
  { url:"https://www.figma.com/best-practices/",                          title:"Figma Best Practices",                      desc:"Design system and component best practices in Figma.",          tags:["design","ux"],                                 col:C.design },
  { url:"https://www.refactoringui.com",                                  title:"Refactoring UI",                            desc:"Learn to design from a developer's perspective.",               tags:["design","ux"],                                 col:C.design },
  { url:"https://inclusive-components.design",                            title:"Inclusive Components",                      desc:"A pattern library for accessible UI.",                          tags:["design","ux","frontend"],                      col:C.design },
  { url:"https://www.smashingmagazine.com",                               title:"Smashing Magazine",                         desc:"Articles for web designers and developers.",                    tags:["design","frontend","ux"],                      col:C.design },

  // ── UI Components (level 1, child of Design) ──
  { url:"https://ui.shadcn.com",                                          title:"shadcn/ui",                                 desc:"Beautifully designed components built with Radix and Tailwind.", tags:["design","react","frontend"],                  col:C.uicomp },
  { url:"https://www.radix-ui.com/primitives/docs/overview/introduction", title:"Radix UI Primitives",                       desc:"Unstyled, accessible UI components for React.",                 tags:["react","design","frontend"],                   col:C.uicomp },
  { url:"https://ark-ui.com",                                             title:"Ark UI",                                    desc:"Headless UI components for your design system.",                tags:["design","react","frontend"],                   col:C.uicomp },
  { url:"https://headlessui.com",                                         title:"Headless UI",                               desc:"Completely unstyled, accessible UI components.",                tags:["design","react","frontend"],                   col:C.uicomp },
  { url:"https://www.base-ui.com",                                        title:"Base UI",                                   desc:"Unstyled UI components from MUI.",                              tags:["design","react","frontend"],                   col:C.uicomp },
  { url:"https://lucide.dev",                                             title:"Lucide Icons",                              desc:"Beautiful & consistent icon toolkit.",                           tags:["design","frontend"],                           col:C.uicomp },
  { url:"https://phosphoricons.com",                                      title:"Phosphor Icons",                            desc:"A flexible icon family for interfaces.",                         tags:["design","frontend"],                           col:C.uicomp },

  // ── AI & ML (root) ──
  { url:"https://www.deeplearning.ai",                                    title:"DeepLearning.AI",                           desc:"Andrew Ng's AI education platform.",                            tags:["ai","tutorial"],                               col:C.ai },
  { url:"https://www.promptingguide.ai",                                  title:"Prompt Engineering Guide",                  desc:"Comprehensive guide to prompt engineering techniques.",         tags:["ai","tutorial","reference"],                   col:C.ai },
  { url:"https://ollama.com",                                             title:"Ollama",                                    desc:"Run large language models locally.",                            tags:["ai","tools","open-source"],                    col:C.ai },

  // ── Research (level 1, child of AI & ML) ──
  { url:"https://arxiv.org/list/cs.LG/recent",                            title:"arXiv – Machine Learning",                  desc:"Latest machine learning research papers.",                      tags:["ai","reference"],                              col:C.aiResearch },
  { url:"https://paperswithcode.com",                                     title:"Papers With Code",                          desc:"Machine learning papers with code implementations.",            tags:["ai","open-source","reference"],                col:C.aiResearch },
  { url:"https://huggingface.co/docs",                                    title:"Hugging Face Documentation",                desc:"Docs for transformers, datasets, and the Hub.",                 tags:["ai","python","open-source"],                   col:C.aiResearch },
  { url:"https://pytorch.org/docs/stable/index.html",                     title:"PyTorch Documentation",                     desc:"Official PyTorch documentation.",                               tags:["ai","python","reference"],                     col:C.aiResearch },
  { url:"https://www.tensorflow.org/learn",                               title:"TensorFlow – Learn ML",                     desc:"Tutorials and guides for TensorFlow.",                          tags:["ai","python"],                                 col:C.aiResearch },

  // ── Tools & APIs (level 1, child of AI & ML) ──
  { url:"https://platform.openai.com/docs",                               title:"OpenAI Platform Documentation",             desc:"API reference and guides for OpenAI models.",                   tags:["ai","reference","backend"],                    col:C.aiTools },
  { url:"https://docs.anthropic.com",                                     title:"Anthropic Claude API Docs",                 desc:"Complete documentation for Claude models and APIs.",            tags:["ai","reference"],                              col:C.aiTools },
  { url:"https://mistral.ai/docs",                                        title:"Mistral AI Documentation",                  desc:"Docs for Mistral models and API.",                              tags:["ai","reference"],                              col:C.aiTools },
  { url:"https://vercel.com/blog/introducing-the-vercel-ai-sdk",          title:"Vercel AI SDK",                             desc:"Build AI-powered streaming text and chat UIs.",                 tags:["ai","typescript","frontend"],                  col:C.aiTools },
  { url:"https://langchain.com/docs",                                     title:"LangChain Documentation",                   desc:"Framework for building LLM-powered applications.",              tags:["ai","python","backend"],                       col:C.aiTools },
  { url:"https://www.llamaindex.ai/docs",                                 title:"LlamaIndex Documentation",                  desc:"Data framework for LLM applications.",                          tags:["ai","python","backend"],                       col:C.aiTools },
  { url:"https://replicate.com",                                          title:"Replicate",                                 desc:"Run and fine-tune open-source models in the cloud.",            tags:["ai","tools"],                                  col:C.aiTools },
  { url:"https://github.com/openai/openai-cookbook",                      title:"OpenAI Cookbook",                           desc:"Examples and guides for using the OpenAI API.",                tags:["ai","open-source","tutorial"],                  col:C.aiTools },

  // ── DevOps (root) ──
  { url:"https://developers.cloudflare.com",                              title:"Cloudflare Developer Docs",                 desc:"Documentation for Cloudflare Workers, D1, and Pages.",         tags:["devops","backend"],                            col:C.devops },
  { url:"https://vercel.com/docs",                                        title:"Vercel Documentation",                      desc:"Deploy and scale your web applications.",                       tags:["devops","frontend"],                           col:C.devops },
  { url:"https://fly.io/docs/",                                           title:"Fly.io Documentation",                      desc:"Run full-stack apps and databases close to your users.",        tags:["devops","backend"],                            col:C.devops },
  { url:"https://railway.app/docs",                                       title:"Railway Documentation",                     desc:"Instant deployments with a focus on developer experience.",     tags:["devops","tools"],                              col:C.devops },

  // ── Cloud (level 1, child of DevOps) ──
  { url:"https://aws.amazon.com/documentation/",                          title:"AWS Documentation",                         desc:"Technical documentation for Amazon Web Services.",              tags:["devops","backend","reference"],                col:C.cloud },
  { url:"https://cloud.google.com/docs",                                  title:"Google Cloud Documentation",                desc:"Guides and reference for Google Cloud Platform.",               tags:["devops","backend","reference"],                col:C.cloud },
  { url:"https://learn.microsoft.com/en-us/azure/",                       title:"Azure Documentation",                       desc:"Microsoft Azure cloud platform documentation.",                 tags:["devops","backend","reference"],                col:C.cloud },
  { url:"https://supabase.com/docs",                                      title:"Supabase Documentation",                    desc:"Open source Firebase alternative built on PostgreSQL.",         tags:["devops","database","backend","open-source"],   col:C.cloud },
  { url:"https://neon.tech/docs",                                         title:"Neon Documentation",                        desc:"Serverless Postgres platform.",                                 tags:["devops","database","backend"],                 col:C.cloud },

  // ── CI/CD & IaC (level 1, child of DevOps) ──
  { url:"https://docs.docker.com",                                        title:"Docker Documentation",                      desc:"Official Docker documentation.",                                tags:["devops","reference"],                          col:C.cicd },
  { url:"https://kubernetes.io/docs/home/",                               title:"Kubernetes Documentation",                  desc:"Official Kubernetes documentation.",                            tags:["devops","reference"],                          col:C.cicd },
  { url:"https://docs.github.com/en/actions",                             title:"GitHub Actions Documentation",              desc:"Automate, customize, and execute workflows in GitHub.",         tags:["devops","tools"],                              col:C.cicd },
  { url:"https://www.terraform.io/docs",                                  title:"Terraform Documentation",                   desc:"Infrastructure as Code with Terraform.",                        tags:["devops","reference"],                          col:C.cicd },
  { url:"https://prometheus.io/docs/introduction/overview/",              title:"Prometheus Documentation",                  desc:"Open-source monitoring system and time series database.",       tags:["devops","open-source"],                        col:C.cicd },
  { url:"https://grafana.com/docs/grafana/latest/",                       title:"Grafana Documentation",                     desc:"The open observability platform documentation.",                tags:["devops","tools","open-source"],                col:C.cicd },
  { url:"https://nginx.org/en/docs/",                                     title:"NGINX Documentation",                       desc:"Official NGINX documentation.",                                 tags:["devops","backend","reference"],                col:C.cicd },

  // ── Reading List (root, no children) ──
  { url:"https://overreacted.io",                                         title:"Overreacted – Dan Abramov",                 desc:"Personal blog by React core team member Dan Abramov.",         tags:["javascript","react","frontend"],               col:C.reading },
  { url:"https://www.joshwcomeau.com",                                    title:"Josh W. Comeau's Blog",                     desc:"Interactive deep-dives into CSS, React, and animation.",        tags:["css","react","frontend"],                      col:C.reading },
  { url:"https://kentcdodds.com/blog",                                    title:"Kent C. Dodds Blog",                        desc:"Articles on testing, React, and software quality.",             tags:["javascript","react","testing"],                col:C.reading },
  { url:"https://tkdodo.eu/blog",                                         title:"TkDodo's Blog",                             desc:"Articles about React Query and TypeScript.",                    tags:["react","typescript"],                          col:C.reading },
  { url:"https://css-tricks.com",                                         title:"CSS-Tricks",                                desc:"Tips, Tricks, and Techniques on using CSS.",                    tags:["css","frontend","design"],                     col:C.reading },
  { url:"https://www.patterns.dev",                                       title:"Patterns.dev",                              desc:"Modern web app design patterns and component patterns.",         tags:["javascript","frontend","reference"],            col:C.reading },
  { url:"https://2ality.com",                                             title:"2ality – JavaScript",                       desc:"Dr. Axel Rauschmayer's blog on JavaScript and TypeScript.",     tags:["javascript","typescript"],                     col:C.reading },
  { url:"https://www.swyx.io",                                            title:"swyx.io",                                   desc:"Writing on React, TypeScript, and developer productivity.",     tags:["javascript","typescript","frontend"],           col:C.reading },
  { url:"https://martinfowler.com",                                       title:"Martin Fowler",                             desc:"Articles on software design, architecture and agile.",          tags:["backend","reference"],                         col:C.reading },
  { url:"https://newsletter.pragmaticengineer.com",                       title:"The Pragmatic Engineer",                    desc:"Insights from inside tech companies.",                          tags:["reference"],                                   col:C.reading },
  { url:"https://roadmap.sh",                                             title:"Developer Roadmaps",                        desc:"Community-driven roadmaps for developers.",                     tags:["reference","tutorial"],                        col:C.reading },
  { url:"https://web.dev/learn",                                          title:"Learn Web Development – web.dev",           desc:"Courses and resources for learning modern web development.",    tags:["frontend","tutorial","reference"],              col:C.reading },
  { url:"https://frontendmasters.com",                                    title:"Frontend Masters",                          desc:"Level up your JavaScript and React skills.",                    tags:["javascript","frontend","tutorial"],             col:C.reading },
]

// ── Collect all unique tag names ──────────────────────────────────────────────
const allTagNames = [...new Set(raw.flatMap(b => b.tags))]
const tagMap = Object.fromEntries(
  allTagNames.map(name => [name, randomUUID()])
)

// ── Build SQL ─────────────────────────────────────────────────────────────────
const lines = []
lines.push(`-- Seed data: ${collections.length} collections (3 levels), ${raw.length} bookmarks`)
lines.push("-- Generated: " + now)
lines.push("")

// Collections
for (const [i, c] of collections.entries()) {
  const createdAt = new Date(Date.now() - (collections.length - i) * 60000).toISOString()
  const parentVal = c.parent ? `'${c.parent}'` : "NULL"
  lines.push(
    `INSERT INTO collection (collection_id, parent_collection_id, name, color, sort, created_at, updated_at) VALUES ('${c.id}', ${parentVal}, '${esc(c.name)}', '${c.color}', ${c.sort}, '${createdAt}', '${createdAt}');`
  )
}
lines.push("")

// Tags
for (const [name, id] of Object.entries(tagMap)) {
  lines.push(
    `INSERT INTO tag (tag_id, name, created_at, updated_at) VALUES ('${id}', '${esc(name)}', '${now}', '${now}');`
  )
}
lines.push("")

// Bookmarks + bookmark_tag
for (const [i, b] of raw.entries()) {
  const bmId = randomUUID()
  const hash = urlHash(b.url)
  const createdAt = new Date(Date.now() - (raw.length - i) * 3600000).toISOString()
  const favicon = `https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=64`
  const desc = b.desc ? `'${esc(b.desc)}'` : "NULL"

  lines.push(
    `INSERT INTO bookmark (bookmark_id, collection_id, url, url_hash, title, description, favicon, sort, created_at, updated_at) VALUES ('${bmId}', '${b.col}', '${esc(b.url)}', '${hash}', '${esc(b.title)}', ${desc}, '${favicon}', ${i + 1}, '${createdAt}', '${createdAt}');`
  )
  for (const tag of b.tags) {
    const tagId = tagMap[tag]
    if (tagId) {
      lines.push(
        `INSERT INTO bookmark_tag (bookmark_id, tag_id, created_at) VALUES ('${bmId}', '${tagId}', '${createdAt}');`
      )
    }
  }
  lines.push("")
}

const sql = lines.join("\n")
writeFileSync(new URL("../seed.sql", import.meta.url), sql)
console.log(`✅ seed.sql generated: ${collections.length} collections (3 levels), ${raw.length} bookmarks, ${allTagNames.length} tags`)
