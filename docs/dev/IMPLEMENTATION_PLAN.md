# UI Design System Implementation Plan

## Overview
Implement a production-ready UI design system inspired by reference images with 5 major components:
1. Settings Dialog (sidebar + sections)
2. Enhanced User Dropdown (with Preferences/Theme)
3. View Branch Dropdown (git operations)
4. File Tree (collapsible folders)
5. Code Editor Tabs (with close button)

**Constraints:**
- MVP/production-ready (no placeholders, mockups, or TODOs)
- Modular architecture with clear separation of concerns
- No code duplication
- All required server-side APIs in place
- Dark theme with magenta/pink accents

---

## Architecture Overview

### File Structure
```
components/
├── settings/
│   ├── settings-dialog.tsx          (Modal wrapper)
│   ├── settings-sidebar.tsx         (Left nav)
│   ├── settings-sections/
│   │   ├── github-section.tsx       (GitHub integration)
│   │   ├── integrations-section.tsx (Slack, Discord, etc.)
│   │   ├── env-vars-section.tsx     (Environment variables)
│   │   ├── template-section.tsx     (Template settings)
│   │   ├── domains-section.tsx      (Custom domains)
│   │   └── analytics-section.tsx    (Analytics config)
│   └── settings-section.tsx         (Reusable section wrapper)
├── layout/
│   ├── global-header.tsx            (Enhanced with new dropdowns)
│   └── user-dropdown.tsx            (Extracted from header)
├── editor/
│   ├── file-tree.tsx                (Collapsible folder structure)
│   ├── editor-tabs.tsx              (File tabs with close)
│   └── editor-panel.tsx             (Updated to include tabs)
└── dropdowns/
    ├── view-branch-dropdown.tsx     (Git operations)
    └── user-preferences-dropdown.tsx (Theme + preferences)

stores/
├── settings-store.ts                (Enhanced for all settings)
└── editor-store.ts                  (File tree + tabs state)

lib/
├── api/
│   ├── settings.ts                  (Settings API client)
│   ├── github.ts                    (GitHub integration)
│   └── integrations.ts              (Third-party integrations)
└── types/
    └── settings.ts                  (Settings types)

app/api/
├── settings/
│   ├── route.ts                     (GET/POST settings)
│   ├── github/route.ts              (GitHub config)
│   ├── integrations/route.ts        (Integrations config)
│   └── env-vars/route.ts            (Environment variables)
├── git/
│   ├── branches/route.ts            (List branches)
│   ├── pr/route.ts                  (PR operations)
│   └── deployments/route.ts         (Deployment info)
└── editor/
    ├── files/route.ts               (File tree)
    └── tabs/route.ts                (Tab state)
```

---

## Component Specifications

### 1. Settings Dialog (`components/settings/settings-dialog.tsx`)
**Purpose:** Modal overlay with sidebar navigation

**Props:**
```typescript
interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Features:**
- Modal dialog (shadcn/ui Dialog)
- Left sidebar with navigation items
- Right panel with dynamic content
- Smooth transitions between sections
- Close button (X) in top-right

**Sections:**
- Vercel Project
- Integrations
- Environment Variables
- GitHub
- Template
- Domains
- Analytics

---

### 2. Settings Sidebar (`components/settings/settings-sidebar.tsx`)
**Purpose:** Navigation menu for settings sections

**Props:**
```typescript
interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}
```

**Features:**
- List of navigation items with icons
- Active state highlighting
- Smooth hover effects
- Icons from Phosphor

---

### 3. Settings Sections

#### GitHub Section (`components/settings/settings-sections/github-section.tsx`)
**Features:**
- Display connected repository
- Show connection status
- Manage button to reconnect
- Display repo owner/name with link

#### Integrations Section (`components/settings/settings-sections/integrations-section.tsx`)
**Features:**
- List of available integrations (Slack, Discord, Telegram)
- Connect/Disconnect buttons
- Status indicators
- Configuration forms

#### Environment Variables Section (`components/settings/settings-sections/env-vars-section.tsx`)
**Features:**
- Add/Edit/Delete env vars
- Key-value input pairs
- Masked values for secrets
- Copy to clipboard

#### Template Section (`components/settings/settings-sections/template-section.tsx`)
**Features:**
- Select project template
- Template preview
- Update template

#### Domains Section (`components/settings/settings-sections/domains-section.tsx`)
**Features:**
- Add custom domain
- List connected domains
- DNS configuration
- Remove domain

#### Analytics Section (`components/settings/settings-sections/analytics-section.tsx`)
**Features:**
- Analytics provider selection
- Configuration options
- Enable/Disable toggle

---

### 4. Enhanced User Dropdown (`components/dropdowns/user-preferences-dropdown.tsx`)
**Purpose:** User menu with preferences section

**Structure:**
```
├── Email display
├── Profile
├── Account Settings
├── Pricing (external)
├── Documentation (external)
├── Community Forum (external)
├── Feedback
├── Refer
├── Credits (with version)
├── ─────────────────
├── Preferences
│   └── Theme (System/Light/Dark)
└── Sign Out
```

**Features:**
- External link indicators
- Theme toggle with icons
- Smooth transitions
- Keyboard navigation

---

### 5. View Branch Dropdown (`components/dropdowns/view-branch-dropdown.tsx`)
**Purpose:** Git operations menu

**Options:**
- View PR
- Merge PR
- Preview Deployment
- Published Site

**Features:**
- Icons for each option
- Disabled state for unavailable options
- Keyboard shortcuts
- Loading states

---

### 6. File Tree (`components/editor/file-tree.tsx`)
**Purpose:** Collapsible folder structure

**Features:**
- Recursive folder/file rendering
- Expand/collapse folders
- File icons based on extension
- Click to open file
- Right-click context menu
- Drag-and-drop (optional)
- Search/filter

**Props:**
```typescript
interface FileTreeProps {
  files: FileNode[]
  onFileSelect: (path: string) => void
  onFileDelete?: (path: string) => void
  onFileRename?: (oldPath: string, newPath: string) => void
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  icon?: string
}
```

---

### 7. Editor Tabs (`components/editor/editor-tabs.tsx`)
**Purpose:** File tabs with close button

**Features:**
- Tab for each open file
- Active tab highlighting
- Close button (X) on each tab
- Unsaved indicator (dot)
- Right-click context menu
- Keyboard shortcuts (Ctrl+W to close)
- Scroll if too many tabs

**Props:**
```typescript
interface EditorTabsProps {
  tabs: EditorTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabCloseAll?: () => void
}

interface EditorTab {
  id: string
  name: string
  path: string
  isDirty?: boolean
  icon?: string
}
```

---

## State Management

### Settings Store (`stores/settings-store.ts`)
```typescript
interface SettingsState {
  // GitHub
  githubRepo: { owner: string; name: string } | null
  githubConnected: boolean
  
  // Integrations
  integrations: Record<string, IntegrationConfig>
  
  // Environment Variables
  envVars: Record<string, string>
  
  // Template
  template: string
  
  // Domains
  domains: string[]
  
  // Analytics
  analyticsProvider: string | null
  
  // Preferences
  theme: 'system' | 'light' | 'dark'
  
  // Actions
  setGithubRepo: (repo: { owner: string; name: string }) => void
  setIntegration: (name: string, config: IntegrationConfig) => void
  setEnvVar: (key: string, value: string) => void
  deleteEnvVar: (key: string) => void
  setTheme: (theme: 'system' | 'light' | 'dark') => void
  // ... more actions
}
```

### Editor Store (`stores/editor-store.ts`)
```typescript
interface EditorState {
  // File Tree
  fileTree: FileNode[]
  expandedFolders: Set<string>
  
  // Tabs
  openTabs: EditorTab[]
  activeTabId: string
  
  // Actions
  setFileTree: (tree: FileNode[]) => void
  toggleFolder: (path: string) => void
  openFile: (path: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  // ... more actions
}
```

---

## API Endpoints

### Settings APIs

#### GET/POST `/api/settings`
**GET:** Fetch all settings for current user
**POST:** Update settings

```typescript
// Request
{ 
  githubRepo?: { owner: string; name: string }
  integrations?: Record<string, IntegrationConfig>
  envVars?: Record<string, string>
  theme?: 'system' | 'light' | 'dark'
  // ... other settings
}

// Response
{
  success: boolean
  settings: SettingsData
  message?: string
}
```

#### POST `/api/settings/github`
Connect/disconnect GitHub repository

```typescript
// Request
{ action: 'connect' | 'disconnect', repoUrl?: string }

// Response
{ success: boolean, repo?: { owner: string; name: string } }
```

#### POST `/api/settings/integrations`
Configure integrations

```typescript
// Request
{ 
  integration: string // 'slack' | 'discord' | 'telegram'
  action: 'connect' | 'disconnect'
  config?: Record<string, string>
}

// Response
{ success: boolean, integration: IntegrationConfig }
```

#### GET/POST `/api/settings/env-vars`
Manage environment variables

```typescript
// POST Request
{ key: string, value: string, action: 'set' | 'delete' }

// Response
{ success: boolean, envVars: Record<string, string> }
```

### Git APIs

#### GET `/api/git/branches`
List branches for current chat

```typescript
// Response
{
  branches: Array<{
    name: string
    sha: string
    isDefault: boolean
  }>
}
```

#### POST `/api/git/pr`
View/create PR

```typescript
// Request
{ action: 'view' | 'create', branchName?: string }

// Response
{
  success: boolean
  pr?: { number: number; url: string; state: string }
}
```

#### POST `/api/git/merge`
Merge PR

```typescript
// Request
{ prNumber: number, commitMessage?: string }

// Response
{ success: boolean, message: string }
```

#### GET `/api/git/deployments`
Get deployment info

```typescript
// Response
{
  preview?: { url: string; status: string }
  published?: { url: string; status: string }
}
```

### Editor APIs

#### GET `/api/editor/files`
Get file tree for current project

```typescript
// Response
{
  files: FileNode[]
}
```

#### GET/POST `/api/editor/tabs`
Manage editor tabs state

```typescript
// POST Request
{ tabs: EditorTab[], activeTabId: string }

// Response
{ success: boolean }
```

---

## Implementation Order

1. **Phase 1: Foundation**
   - Create settings store (enhanced)
   - Create editor store
   - Create settings types

2. **Phase 2: Components**
   - Settings dialog + sidebar
   - Settings sections (all 6)
   - User dropdown (enhanced)
   - View branch dropdown

3. **Phase 3: Editor Components**
   - File tree
   - Editor tabs
   - Update editor panel

4. **Phase 4: APIs**
   - Settings endpoints
   - Git endpoints
   - Editor endpoints

5. **Phase 5: Integration**
   - Wire components to stores
   - Wire stores to APIs
   - Update global header
   - Test all flows

---

## Key Design Decisions

1. **Modal vs Inline Settings:** Using modal dialog for settings (matches reference design)
2. **Sidebar Navigation:** Left sidebar for section selection (matches reference)
3. **Stores:** Zustand for all state (consistent with existing codebase)
4. **API Structure:** RESTful with clear resource paths
5. **Icons:** Phosphor icons throughout (consistent with codebase)
6. **Theme:** Dark theme with magenta/pink accents (from reference)
7. **Responsive:** Mobile-friendly with collapsible sidebar

---

## Dead Code to Remove

- `components/settings/profile-form.tsx` — Merge into settings dialog
- `app/(dashboard)/settings/page.tsx` — Replace with settings dialog trigger
- Unused settings-related components

---

## Testing Strategy

1. **Unit Tests:** Component rendering, state management
2. **Integration Tests:** API calls, store updates
3. **E2E Tests:** Full user flows (open settings, change theme, etc.)
4. **Manual Testing:** All browsers, dark/light mode, responsive

---

## Success Criteria

✅ All components render correctly
✅ All APIs functional and tested
✅ State management working (stores)
✅ No console errors or warnings
✅ Responsive on mobile/tablet/desktop
✅ Dark theme applied correctly
✅ Keyboard navigation working
✅ No code duplication
✅ Production-ready (no TODOs/placeholders)
