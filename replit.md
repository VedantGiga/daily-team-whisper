# AutoBrief AI - AI-Powered Work Summary Platform

## Overview

AutoBrief is a full-stack web application that provides AI-powered work summaries by integrating with various productivity tools. The application features user authentication, a dashboard for managing integrations, and automated daily report generation. It uses a modern tech stack with React frontend, Express backend, and supports both PostgreSQL and Firebase for different data storage needs.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, React Context for authentication
- **Routing**: React Router with protected routes
- **Build Tool**: Vite with hot module replacement and development optimizations

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database**: Dual database support - PostgreSQL (via Drizzle ORM) and Firebase Firestore
- **Authentication**: Firebase Authentication with email/password and Google OAuth
- **Development**: Hot reload with tsx for development server

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless with connection pooling
- **ORM**: Drizzle ORM with Zod schema validation
- **Authentication Database**: Firebase Firestore for user profiles and session management
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Authentication System
- Firebase Authentication handles user registration, login, and session management
- Support for email/password and Google OAuth sign-in
- Email verification workflow with protected routes
- User profile management with additional metadata stored in Firestore

### User Interface
- Modern dashboard with integration cards and summary displays
- Responsive design with dark/light theme support
- Component library based on Radix UI with consistent design tokens
- Network status monitoring with offline capability indicators

### Integration Framework
- Modular integration system for connecting external services (GitHub, Slack, Google Calendar, Jira, Notion)
- Storage abstraction layer with in-memory implementation for development
- Prepared for database-backed storage with Drizzle ORM schema

### Development Environment
- Replit-optimized configuration with appropriate modules and deployment settings
- Vite development server with HMR and error overlay
- TypeScript configuration with path aliases for clean imports

## Data Flow

1. **User Authentication**: Firebase handles authentication, user profiles stored in Firestore
2. **Application State**: React Query manages server state, Context provides auth state
3. **Data Persistence**: PostgreSQL via Drizzle ORM for application data, Firebase for user data
4. **Integration Data**: External service data flows through storage abstraction layer
5. **Real-time Updates**: Network status monitoring with Firebase connectivity state

## External Dependencies

### Core Services
- **Firebase**: Authentication, Firestore database, and hosting infrastructure
- **Neon**: Serverless PostgreSQL database hosting
- **Supabase**: Additional database services (configured but not actively used)

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Frontend build tool and development server
- **ESBuild**: Backend bundling for production builds

### UI Components
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

## Deployment Strategy

### Development
- Replit environment with hot reload for both frontend and backend
- Vite dev server with proxy to Express backend
- Firebase emulators for local development (optional)

### Production
- Static frontend build served by Express server
- Single server deployment with built frontend assets
- Environment variables for database and Firebase configuration
- Autoscaling deployment target on Replit infrastructure

The application uses a monorepo structure with shared schema definitions and TypeScript configurations for consistency across frontend and backend codebases.

## Changelog
- June 24, 2025. Enhanced Dashboard with Analytics, Quick Actions, and Mobile Improvements:
  - Added comprehensive analytics dashboard with charts and productivity insights
  - Implemented quick actions panel for common productivity tasks
  - Created recent activity feed with filtering and real-time updates
  - Enhanced mobile UI with better touch interactions and responsive design
  - Added data export functionality for user privacy and data portability
  - Improved AI summary generation with customizable tone and filtering
  - Added performance optimizations and smooth animations
- June 24, 2025. Cloudinary profile photo upload integration:
  - Added complete Cloudinary integration for profile photo uploads
  - Implemented smooth UX with loading states and image previews
  - Added comprehensive error handling and file validation
  - Created backend endpoints with secure file upload handling
  - Optimized images automatically (400x400, WebP format, face detection cropping)
  - Integrated with both Account and Profile pages
  - Added fallback handling when Cloudinary credentials not configured
  - Fixed React Query configuration to prevent console errors and improved error handling
- June 20, 2025. Complete Notion integration implementation:
  - Added full Notion API integration with client setup and database management
  - Created structured Notion databases: Work Activities and Daily Summaries
  - Implemented connection flow with automatic database creation
  - Added comprehensive error handling and configuration testing
  - Successfully connected Notion workspace with database IDs generated
- June 20, 2025. Integration setup and OAuth configuration:
  - Fixed Google Calendar OAuth flow (GET request, proper config checking)
  - Added comprehensive OAuth setup guide (GOOGLE_OAUTH_SETUP.md)
  - Database tables successfully created and populated
  - GitHub integration fully functional with provided API keys
  - Google Calendar requires redirect URI registration in Google Cloud Console
- June 20, 2025. UI improvements to landing page navbar:
  - Removed navigation links (Features, How it Works, Reviews) for cleaner design
  - Increased logo size to h-24 w-48 for better visibility and brand presence
  - Maintained responsive design and dark mode compatibility
- June 19, 2025. Migration from Replit Agent to standard Replit environment completed:
  - Fixed authentication persistence when navigating between pages
  - Updated landing page to show appropriate buttons for authenticated users
  - Resolved server database import issues for clean deployment
  - Maintained user preference for landing page with "Never miss a beat" text
- June 19, 2025. Added comprehensive integration management system:
  - Database schema for integrations, work activities, and daily summaries
  - Backend API with OAuth flows for external service connections
  - Frontend integration manager with real-time status and controls
  - GitHub integration with OAuth flow (ready for production with API keys)
  - Sample data demonstrating activity tracking and summary generation
- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Navigation preference: Landing page with "Never miss a beat" text as home page instead of dashboard.
UI preference: Logo visibility fixed for dark theme across all components.