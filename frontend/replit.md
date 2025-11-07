# Replit.md

## Overview

This is a full-stack web application built with Express.js backend and React frontend, designed as a conversational AI interface for business intelligence queries. The application uses PostgreSQL with Drizzle ORM for data persistence and provides a chat-like interface for users to interact with business data and analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful endpoints for conversations and messages
- **Development**: TSX for TypeScript execution in development

## Key Components

### Database Schema
- **Conversations Table**: Stores chat conversation metadata (id, title, timestamps)
- **Messages Table**: Stores individual messages with role (user/assistant) and content
- Utilizes Drizzle's schema validation with Zod integration

### Chat Interface
- Real-time typing animation for AI responses
- Message persistence across sessions
- Support for rich text formatting and business intelligence visualizations
- Voice input capabilities (when supported by browser)
- Responsive design optimized for business dashboard usage

### Business Intelligence Integration
- AI-powered query analysis for business metrics
- Performance celebrations with confetti animations
- Specialized prompt generators for common business questions
- KPI dashboard with real-time metrics
- Integration with business context data (products, sales, clients)

### Storage Layer
- In-memory storage implementation for development
- Database migrations managed through Drizzle Kit
- Conversation and message CRUD operations
- Automatic timestamp management

## Data Flow

1. **User Input**: Messages entered through chat interface
2. **Frontend Processing**: React Query handles API calls and state management
3. **Backend Processing**: Express routes validate and process requests
4. **AI Processing**: Business intelligence analysis of user queries
5. **Data Persistence**: Messages stored in PostgreSQL via Drizzle ORM
6. **Response Delivery**: Typed responses streamed back to frontend
7. **UI Updates**: Real-time updates with typing animations and celebrations

## External Dependencies

### Core Dependencies
- **Database**: Neon serverless PostgreSQL for cloud-hosted database
- **AI Services**: OpenAI API integration for intelligent responses
- **UI Components**: Radix UI primitives for accessible component foundation
- **Font**: Google Fonts (Inter) for consistent typography

### Development Tools
- **Type Safety**: TypeScript across entire stack
- **Code Quality**: ESM modules with strict TypeScript configuration
- **Hot Reload**: Vite HMR for rapid development iteration
- **Path Aliases**: Configured for clean import statements

### Production Dependencies
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Error Handling**: Runtime error overlays in development

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20, Web, PostgreSQL 16 modules
- **Development**: `npm run dev` for concurrent frontend/backend development
- **Production Build**: `npm run build` creates optimized bundles
- **Deployment**: Autoscale deployment target with proper port configuration

### Environment Setup
- **Database URL**: Required environment variable for PostgreSQL connection
- **OpenAI API Key**: Optional for AI functionality
- **Port Configuration**: Frontend served on port 5000, backend API integrated

### Build Process
1. Frontend builds to `dist/public` directory
2. Backend bundles to `dist/index.js`
3. Static assets served by Express in production
4. Database migrations applied via `npm run db:push`

## Changelog
```
Changelog:
- June 16, 2025. Initial setup
- June 17, 2025. Complete Spanish localization implemented
  * All UI components translated to Spanish
  * KPI dashboard with realistic La Doña business data
  * BI sidebar with Spanish translations for Performance/Risks/Opportunities
  * Prompt generator with Spanish business questions
  * Chat interface and message components localized
  * AI response system configured for automatic Spanish detection and responses
  * All KPI cards, metrics, and business insights fully translated
  * Enhanced Spanish keyword detection for business queries
  * Interface components completely localized (Performance Score, Zones at Risk, Product Opportunity)
  * All user interaction text translated to Spanish
  * Spanish FAQ responses expanded to match English depth and analytical quality
  * Three critical business questions now have comprehensive Spanish responses:
    - Budget variance analysis with full financial breakdown
    - Product rotation analysis with actionable recovery plans  
    - Promotional performance analysis with strategic recommendations
  * Complete dynamic language switching implemented (ES/EN toggle)
  * All interface elements update in real-time when language is switched
  * Backend respects language preference for AI responses
  * KPI cards, metrics, and all UI text fully responsive to language selection
- June 19, 2025. Enhanced proactive business intelligence capabilities
  * AI configured as proactive business intelligence assistant for executive decision-making
  * Default focus on sales performance, market trends, and operational data
  * Executive-friendly responses with actionable next steps and follow-up questions
  * Business-first approach to product inquiries using ERP/POS/CRM data sources
  * Comprehensive analysis capability for complex business questions with multi-layered responses
  * Advanced analytics covering financial modeling, forecasting, market intelligence, and strategic planning
  * Enhanced business context data to support all suggested prompts with authentic La Doña metrics
  * Complete coverage of critical, strategic, and operational business questions with actionable insights
- July 28, 2025. Authentication flow implementation
  * Added framer-motion for smooth animations
  * Created complete login page with form validation
  * Built signup page with password confirmation
  * Implemented multi-step onboarding flow with industry selection, use case mapping, and data source connection
  * Updated routing structure to support authentication workflow: /login -> /signup -> /onboarding -> /dashboard
  * Integrated Wouter routing for seamless navigation between auth pages
- July 29, 2025. Complete dark blue theme implementation
  * Eliminated all white backgrounds across entire application
  * Updated login page with dark blue gradient background and blue-themed form elements
  * Converted signup page to use consistent dark blue theme with blue accent colors
  * Transformed onboarding pages to use slate-800/slate-900 backgrounds with blue highlights
  * Updated chat pages (chat-clean.tsx) to use dark blue gradients and blue accent elements
  * Modified 404 page to use dark theme with blue card styling
  * Applied consistent color scheme: dark blue gradients for backgrounds, slate colors for cards, blue accents for interactive elements
  * All text colors updated to white/blue-200 for optimal contrast on dark backgrounds
  * Created simplified MainDashboard with Microsoft Copilot-style structure: brand section, toggle buttons, KPI cards, and input bar
  * Implemented clean dashboard with mock data for KPIs and prompts, maintaining dark blue theme consistency
- July 30, 2025. Enterprise-level design overhaul for onboarding
  * Complete redesign to enterprise-level monochromatic styling similar to Microsoft/Salesforce
  * Eliminated all colorful gradients and fading colors in favor of clean slate grays
  * Removed percentage display from progress bar (now shows step counter only)
  * Professional copy and content improvements - eliminated unprofessional language
  * Compact, properly-sized design that fits correctly on page
  * Enterprise navigation buttons with clean borders and hover states
  * Professional typography using Segoe UI font family
  * Monochromatic Business Intelligence Setup step with clean form layouts
  * Maintained dark theme while achieving enterprise-level professionalism
- August 12, 2025. Advanced Collaboration Hub with Context Panel Integration
  * Completely transformed collaboration page UI with sophisticated glassmorphism design
  * Implemented centered container layout (max-width: 1280px) with proper spacing tokens
  * Added sticky sub-header with filters (All/Mentions/Unread), search input, and notification counter
  * Created smart chip system for automatic entity detection (#kpi:name, #zone:location, #product:item, #report:title)
  * Built comprehensive CommentCard component with thread structure, avatars, online status indicators, and quick action buttons
  * Implemented slide-over Context Panel (480px width) with tabs: Overview, Chart, Report, Actions
  * Added sparkline charts, entity metadata display, and actionable CTA buttons in context panel
  * Enhanced composer with @mention autocompletion, #tag suggestions, and /slash commands
  * Integrated futuristic micro-interactions: hover glow effects, springy animations, and smooth transitions
  * Implemented lightweight event bus system for coordination between components
  * Added toast notification system for user feedback (Task created, Assigned, Scenario queued)
  * Created comprehensive entity data system linking comments to KPIs, zones, products, and reports
  * All components maintain accessibility (keyboard focus, Esc key handling) and responsive design
- August 12, 2025. Enterprise-Grade AI Scenario Simulator Implementation
  * Complete redesign with enterprise-level organization: grouped inputs into Demand & Pricing, Promotions & Marketing, and Supply Chain sections
  * Added comprehensive tooltip system with Info icons explaining each variable's business impact
  * Implemented unified action button styling using consistent blue theme across Save, Export PDF, and Add Task functions
  * Enhanced results display with side-by-side Current vs Simulated metrics showing percentage changes and delta indicators
  * Integrated intelligent insights system providing contextual explanations for each metric change
  * Added automated recommendation engine suggesting actionable next steps based on simulation results
  * Created collapsible Model Assumptions section displaying calculation formulas in plain language for transparency
  * Added marketing spend variable to promotions section for comprehensive campaign modeling
  * Implemented professional styling with custom slider design, consistent spacing, and enterprise color palette
  * Enhanced entity data with teamMembers export for collaboration features integration
  * Added navigation icons to both main dashboard and collaboration page sidebars for easy access
- August 13, 2025. Critical Bug Fixes and User Experience Enhancements
  * Fixed critical TypeScript compilation errors in MainDashboard component preventing application startup
  * Recreated clean MainDashboard.tsx with proper syntax structure and maintained all existing functionality
  * Added vortex animation CSS for VORTA brand icon with smooth rotation effects
  * Implemented "Skip to Dashboard" button on both login page and onboarding welcome screen for immediate platform access
  * Completely transformed backorder analysis from retrospective comparison to forward-looking predictive assessment
  * New predictive analysis shows August expected loss of $527K with prevention potential of $341K and specific ROI calculations
  * Added three-tier action plan with emergency procurement (ROI: 14,525%), dynamic reorder adjustment (18-day payback), and demand signal enhancement ($1.2M annual savings)
  * Analysis now provides net value creation of +$670K through proactive prevention strategies
  * Maintained enterprise-grade styling and animations throughout user interface
  * All AI Copilot features, backorder analysis, and chat functionality preserved and functional
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
Language: Spanish localization for all user-facing content.
Data requirements: Use realistic La Doña condiment business data.
```