# BIZETO-Tunnel: SaaS Frontend Architecture Plan

## 1. Background & Motivation
BIZETO-Tunnel is evolving from a single-user dashboard into a multi-tenant SaaS application. This requires a comprehensive frontend restructuring to support public landing pages, authentication, role-based dashboards (Owner vs. Regular User), subscription management, and user onboarding (Setup Wizard). The primary goal is to provide a seamless, "zero-headache" user experience, especially during the setup and onboarding phases.

## 2. Scope & Impact
The scope of this plan encompasses the `bizeto_tunnel/dashboard` React application.

**Impacted Areas:**
- **Routing:** Introduction of `react-router-dom` to manage multiple views.
- **State Management:** Implementation of React Context to simulate Authentication and User Roles (Owner vs. User) pending backend integration.
- **Component Structure:** Restructuring the monolithic `App.tsx` into modular components and pages.
- **UI/UX:** Design and implementation of new screens: Landing Page, Login, Setup Wizard, User Dashboard, Owner Dashboard, Profile, and Billing.

## 3. Proposed Architecture

### 3.1. Route Structure
```text
/                  -> Landing Page (Public)
/login             -> Login Page (Public)
/setup             -> Onboarding Wizard (Authenticated - Role Agnostic)
/dashboard         -> Main Dashboard Entry (Redirects based on Role)
   ├── /user       -> User Dashboard (Overview, Tunnels, API Keys)
   └── /owner      -> Owner Dashboard (Overview, Subscriptions, Pricing Setup, Users)
/profile           -> User Profile (Authenticated)
/billing           -> Billing & Subscription Status (Authenticated - User view)
```

### 3.2. Key Pages & Features

**A. Public Pages:**
1.  **Landing Page:** Value proposition, feature highlights, and a pricing table (fetched/simulated from Owner settings). Call to Action: "Get Started".
2.  **Login App:** Simple authentication interface. For the prototype, this will have quick-login buttons: "Login as Owner" and "Login as User" to easily test both flows.

**B. Setup & Onboarding (Zero-Headache Design):**
1.  **Setup Wizard (`/setup`):** A step-by-step guided flow.
    *   **User Flow:** Step 1: Choose Subscription Plan -> Step 2: Generate API Key -> Step 3: Download Agent & Connect.
    *   **Owner Flow (Initial Setup):** Step 1: Configure Base Pricing -> Step 2: Setup Stripe/Payment Keys (Mock) -> Step 3: View Dashboard.

**C. Role-Based Dashboards:**
1.  **User Dashboard:**
    *   *Overview:* Stats (Tunnels, Bandwidth).
    *   *Tunnels:* Manage active tunnel connections.
    *   *API Keys:* Manage authentication keys.
2.  **Owner Dashboard:**
    *   *Overview:* Global SaaS metrics (Total MRR, Active Subscriptions, Total Tunnels).
    *   *Pricing Setup:* UI to define and modify subscription tiers (e.g., Free, Pro, Enterprise).
    *   *User Management:* View registered users and their subscription status.

**D. Account Management:**
1.  **User Profile:** Manage personal details, email, and password.
2.  **Billing & Subscription:** View current active plan, usage limits, invoices, and upgrade/downgrade options.

## 4. Implementation Plan

**Phase 0: Documentation Review (CURRENT STEP)**
- Save this entire architecture document to `bizeto_tunnel/docs/SaaS_Frontend_Architecture.md`.
- **STOP AND WAIT** for the user to review the document and provide feedback. No code changes will be made until the document is reviewed and approved.

**Phase 1: Foundation & Routing**
- Install `react-router-dom` in the dashboard project.
- Set up the main routing structure and placeholder components for all new pages.
- Implement the `AuthContext` to manage simulated user state and roles globally.

**Phase 2: Public Interfaces & Onboarding**
- Build the **Landing Page** with a modern, conversion-focused design.
- Build the **Login Page** with the mock role-selector.
- Build the interactive **Setup Wizard** ensuring the UI is highly intuitive and non-technical.

**Phase 3: Dashboard Restructuring**
- Refactor the existing `App.tsx` logic into the **User Dashboard** layout.
- Build the new **Owner Dashboard** views (Pricing Setup, Subscription Management).
- Ensure the Sidebar navigation dynamically adapts based on the active Role.

**Phase 4: Account & Billing Views**
- Implement the **User Profile** page.
- Implement the **Billing & Subscription Status** page for users to view their limits and active plans.

## 5. Mock Data Strategy (Frontend Only)
Until the Go backend implements these endpoints, the React app will use sophisticated mock data structures to demonstrate the UI:
- `mockPricingPlans`: Defines available tiers (editable by Owner).
- `mockSubscriptions`: Tracks user subscriptions.
- `mockUsers`: List of tenants for the Owner to view.

## 6. Verification
- Manual UI testing of all routes.
- Verify role-based access control (Owner cannot access User-specific billing setup, User cannot access Pricing Setup).
- Verify the Setup Wizard flow successfully guides a new user to the dashboard.
- Ensure Dark/Light mode persists across all new pages.