# AuraCovers - AI-Powered Book Cover Generator

## Overview

AuraCovers is a full-stack web application that leverages Google Gemini AI to generate unique, high-quality book covers based on user input. The application targets independent authors, small publishers, and creative professionals who need professional book cover designs quickly and affordably.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Build Tool**: ESBuild for production bundling

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations
- **Storage**: PostgreSQL 16 (configured via Replit modules)
- **Fallback**: In-memory storage for development

## Key Components

### 1. AI Image Generation Service
- **Provider**: Google Gemini AI (gemini-2.0-flash-preview-image-generation model)
- **Integration**: Direct API calls using @google/genai package
- **Image Processing**: Base64 encoding for client delivery
- **Temporary Storage**: File system for intermediate processing

### 2. Database Schema
- **Users Table**: Basic user authentication (username, password)
- **Book Covers Table**: Generated cover metadata and images
- **Validation**: Zod schemas for type safety and validation

### 3. Form System
- **Input Fields**: Book title, author name, genre, keywords, mood, color palette
- **Validation**: Real-time validation with error messages
- **User Experience**: Progressive enhancement with loading states

### 4. UI Components
- **Design System**: shadcn/ui components with consistent styling
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels and keyboard navigation support

## Data Flow

1. **User Input**: User fills out the book cover generation form
2. **Validation**: Client-side validation using Zod schemas
3. **API Request**: Form data sent to `/api/generate-cover` endpoint
4. **Prompt Construction**: Server constructs AI prompt from user input
5. **AI Generation**: Gemini API generates book cover image
6. **Image Processing**: Image saved temporarily, converted to base64
7. **Database Storage**: Cover metadata and image stored in database
8. **Response**: Base64 image and metadata returned to client
9. **Display**: Generated cover displayed to user with download option

## External Dependencies

### Core Dependencies
- **@google/genai**: Google Gemini AI integration
- **drizzle-orm**: Database ORM and query builder
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation and type safety

### UI Dependencies
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API
- **lucide-react**: Icon library

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler
- **vite**: Frontend build tool and dev server

## Deployment Strategy

### Replit Configuration
- **Platform**: Replit Autoscale deployment
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Port Configuration**: Internal port 5000, external port 80

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (auto-provisioned)
- **GEMINI_API_KEY**: Google Gemini API authentication key
- **NODE_ENV**: Environment mode (development/production)

### Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Static Assets**: Served from `dist/public` directory
4. **Production Start**: Node.js serves bundled application

### Development Workflow
- **Hot Reload**: Vite HMR for frontend development
- **TypeScript**: Real-time type checking and compilation
- **Database**: Drizzle Kit for schema management and migrations

## Changelog

- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.