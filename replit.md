# Overview

This is an FFmpeg Live Streamer application that enables users to upload videos and stream them live to Facebook. The application provides a complete streaming solution with video management, queue management, Facebook integration, and real-time monitoring. It features a modern React frontend with a Node.js/Express backend, utilizing FFmpeg for video processing and streaming capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui components for a consistent design system
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for live updates and notifications

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with WebSocket support for real-time features
- **File Handling**: Multer for video file uploads with validation
- **Video Processing**: FFmpeg service for video streaming and processing
- **Error Handling**: Centralized error handling middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **File Storage**: Local file system storage for uploaded videos in the uploads directory

## Database Schema Design
- **Videos Table**: Stores video metadata including filename, size, duration, and processing status
- **Streaming Sessions**: Manages live streaming session states and configurations
- **Streaming Queue**: Maintains ordered playlist of videos for streaming
- **Stream Configuration**: Stores user preferences for streaming quality and settings
- **Facebook Credentials**: Securely stores Facebook API tokens and page information
- **Stream Metrics**: Tracks streaming analytics including viewer counts and data usage

## External Service Integrations
- **Facebook Graph API**: Integration for live video streaming to Facebook pages
- **FFmpeg**: System-level integration for video processing and RTMP streaming
- **WebSocket Server**: Real-time communication for status updates and notifications

## Authentication and Authorization
- Currently implements session-based authentication preparation with connect-pg-simple for PostgreSQL session storage
- Facebook OAuth integration for accessing user's Facebook pages and streaming permissions

## Development and Production Setup
- **Development**: Hot module replacement with Vite, TypeScript checking, and automatic server restart
- **Build Process**: Vite for frontend bundling and esbuild for backend compilation
- **Environment Configuration**: Environment variables for database connections and API keys
- **Error Monitoring**: Custom error overlay for development debugging

## Key Architectural Decisions

### Monorepo Structure
The application uses a monorepo approach with shared TypeScript schemas and utilities, enabling type safety across frontend and backend boundaries.

### Real-time Updates
WebSocket integration provides immediate feedback for streaming status, upload progress, and system health monitoring.

### Queue Management
Implements a sophisticated queue system allowing users to organize and reorder videos for continuous streaming sessions.

### Modular Component Architecture
Frontend components are highly modular and reusable, with clear separation of concerns between UI components, business logic, and API interactions.

### Type Safety
Extensive use of TypeScript and Zod schemas ensures type safety from database to frontend, reducing runtime errors and improving developer experience.