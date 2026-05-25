import type { Icon } from "@phosphor-icons/react"
import {
  Stack,
  DeviceTablet,
  Globe,
  Layout,
  ShoppingCart,
  PencilSimple,
  ChatTeardropDots,
  Cloud,
  Terminal,
} from "@phosphor-icons/react"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string
  name: string
  description: string
  icon: Icon
  category: TemplateCategory
  prompt: string
  features: string[]
}

export type TemplateCategory =
  | "Full Stack"
  | "Landing"
  | "Dashboard"
  | "Mobile"
  | "E-commerce"
  | "Content"
  | "AI"
  | "Backend"

export interface TemplateCategoryInfo {
  id: TemplateCategory
  label: string
}

// ─── Categories ────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: "Full Stack", label: "Full Stack" },
  { id: "Landing", label: "Landing Pages" },
  { id: "Dashboard", label: "Dashboards" },
  { id: "Mobile", label: "Mobile" },
  { id: "E-commerce", label: "E-commerce" },
  { id: "Content", label: "Content" },
  { id: "AI", label: "AI Apps" },
  { id: "Backend", label: "Backend / API" },
]

// ─── Templates ─────────────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "fullstack-saas",
    name: "SaaS Dashboard",
    description:
      "A full SaaS dashboard with authentication, billing, team management, and analytics.",
    icon: Stack,
    category: "Full Stack",
    prompt:
      "Build a full SaaS dashboard application with user authentication, subscription billing, team management, and analytics charts.",
    features: [
      "User auth & roles",
      "Subscription billing",
      "Team management",
      "Analytics charts",
      "API rate limiting",
    ],
  },
  {
    id: "landing-startup",
    name: "Startup Landing Page",
    description:
      "A modern marketing landing page with hero sections, features grid, pricing, and CTAs.",
    icon: Globe,
    category: "Landing",
    prompt:
      "Build a modern startup landing page with a hero section, feature grid, pricing table, and call-to-action sections.",
    features: [
      "Hero with animations",
      "Features section",
      "Pricing table",
      "CTA sections",
      "SEO optimized",
    ],
  },
  {
    id: "admin-dashboard",
    name: "Admin Dashboard",
    description:
      "A data-rich admin panel with tables, charts, activity feeds, and user management.",
    icon: Layout,
    category: "Dashboard",
    prompt:
      "Build an admin dashboard with data tables, charts, activity feed, user management, and role-based access.",
    features: [
      "Data tables",
      "Charts & metrics",
      "User management",
      "Activity feed",
      "Role-based access",
    ],
  },
  {
    id: "mobile-app",
    name: "Mobile App PWA",
    description:
      "A progressive web app with offline support, push notifications, and native-like UX.",
    icon: DeviceTablet,
    category: "Mobile",
    prompt:
      "Build a progressive web app (PWA) with offline support, push notifications, app shell architecture, and native-feeling interactions.",
    features: [
      "Offline support",
      "Push notifications",
      "App shell",
      "Touch gestures",
      "Add to home screen",
    ],
  },
  {
    id: "ecommerce-store",
    name: "E-commerce Store",
    description:
      "A full online store with product catalog, cart, checkout, and payment integration.",
    icon: ShoppingCart,
    category: "E-commerce",
    prompt:
      "Build an e-commerce store with a product catalog, shopping cart, checkout flow, and payment processing integration.",
    features: [
      "Product catalog",
      "Shopping cart",
      "Checkout flow",
      "Payment processing",
      "Order management",
    ],
  },
  {
    id: "blog-platform",
    name: "Blog Platform",
    description:
      "A content-rich blog with markdown editor, categories, comments, and RSS feeds.",
    icon: PencilSimple,
    category: "Content",
    prompt:
      "Build a blog platform with a markdown editor, categories, tags, comments system, and RSS feed support.",
    features: [
      "Markdown editor",
      "Categories & tags",
      "Comments system",
      "RSS feeds",
      "Search",
    ],
  },
  {
    id: "ai-chat-app",
    name: "AI Chat App",
    description:
      "An AI-powered chat application with streaming responses, tool calling, and conversation history.",
    icon: ChatTeardropDots,
    category: "AI",
    prompt:
      "Build an AI chat application with streaming responses, tool calling, conversation history, and markdown rendering.",
    features: [
      "Streaming responses",
      "Tool calling",
      "Conversation history",
      "Markdown rendering",
      "Code syntax highlighting",
    ],
  },
  {
    id: "api-backend",
    name: "REST API Backend",
    description:
      "A production-ready REST API with authentication, CRUD routes, validation, and OpenAPI docs.",
    icon: Cloud,
    category: "Backend",
    prompt:
      "Build a REST API backend with authentication, CRUD endpoints, request validation, error handling, and OpenAPI documentation.",
    features: [
      "JWT authentication",
      "CRUD endpoints",
      "Request validation",
      "Error handling",
      "OpenAPI docs",
    ],
  },
  {
    id: "cli-tool",
    name: "CLI Application",
    description:
      "A command-line tool with subcommands, flags, progress bars, and colorful output.",
    icon: Terminal,
    category: "Backend",
    prompt:
      "Build a CLI application with subcommands, flags, progress indicators, and colorful terminal output.",
    features: [
      "Subcommands",
      "Flag parsing",
      "Progress bars",
      "Colorful output",
      "Config file support",
    ],
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter((t) => t.category === category)
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function getCategories(): TemplateCategoryInfo[] {
  return TEMPLATE_CATEGORIES
}

// ─── Filter Store ───────────────────────────────────────────────────────────

import { create } from "zustand"

interface TemplateFilterState {
  activeCategory: string
  setActiveCategory: (category: string) => void
}

export const useTemplateFilter = create<TemplateFilterState>()((set) => ({
  activeCategory: "all",
  setActiveCategory: (category) => set({ activeCategory: category }),
}))
