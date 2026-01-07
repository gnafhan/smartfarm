# Implementation Plan: Livestock IoT Monitoring & Management System

## Overview

This implementation plan breaks down the Livestock IoT Monitoring System into incremental coding tasks. The backend uses NestJS with TypeScript, MongoDB, Redis, and MQTT. The frontend uses Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui. Tasks are ordered to build foundational components first, then layer features progressively.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - [x] 1.1 Configure Docker Compose for development infrastructure
    - Create docker-compose.yml with MongoDB, Redis, and Mosquitto services
    - Add volume configurations for data persistence
    - Create mosquitto configuration file
    - _Requirements: Infrastructure setup_

  - [x] 1.2 Set up backend NestJS project structure
    - Initialize module structure (auth, users, livestock, barns, monitoring, entry-exit, alerts, farms, mqtt, websocket)
    - Configure environment variables and validation
    - Set up MongoDB connection with Mongoose
    - Set up Redis connection
    - _Requirements: Backend foundation_

  - [x] 1.3 Set up frontend Next.js project structure
    - Configure App Router directory structure
    - Set up Tailwind CSS and shadcn/ui
    - Configure environment variables
    - Set up Zustand stores skeleton
    - _Requirements: Frontend foundation_

- [x] 2. Database Schemas and Common Utilities
  - [x] 2.1 Create Mongoose schemas for all entities
    - Implement User, Livestock, Barn, GasSensorReading, EntryExitLog, Alert, Farm schemas
    - Add indexes for frequently queried fields
    - Configure TTL index for GasSensorReading (90 days)
    - _Requirements: 3.1, 3.2, 5.1, 6.6_

  - [ ]* 2.2 Write property test for schema validation
    - **Property 10: QR Code Integrity** - Verify UUID generation and uniqueness
    - **Validates: Requirements 3.1, 4.4**

  - [x] 2.3 Create common DTOs and validation decorators
    - Implement pagination, filtering, and sorting DTOs
    - Create custom validators for ear tag, barn code uniqueness
    - _Requirements: 3.3, 7.5, 8.6_

  - [x] 2.4 Create gas threshold utility functions
    - Implement calculateAlertLevel function
    - Define threshold constants
    - _Requirements: 6.3_

  - [ ]* 2.5 Write property test for gas threshold calculation
    - **Property 19: Gas Threshold Calculation Correctness**
    - **Validates: Requirements 6.3**

- [x] 3. Checkpoint - Verify schemas and utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Authentication Module
  - [x] 4.1 Implement Auth service and controller
    - Create login endpoint with JWT token generation
    - Create refresh token endpoint
    - Create get profile endpoint
    - Implement password hashing with bcrypt
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [ ]* 4.2 Write property tests for authentication
    - **Property 1: Valid Authentication Returns Tokens**
    - **Property 4: Password Hashing Invariant**
    - **Property 5: Profile Response Excludes Password**
    - **Validates: Requirements 1.1, 1.5, 1.6**

  - [x] 4.3 Implement JWT guards and strategies
    - Create JwtAuthGuard for protected routes
    - Create RolesGuard for role-based access
    - Implement token validation and refresh logic
    - _Requirements: 1.4, 2.3_

  - [ ]* 4.4 Write property tests for authorization
    - **Property 2: Invalid Credentials Error Uniformity**
    - **Property 3: Invalid Refresh Token Rejection**
    - **Property 8: Role-Based Access Control**
    - **Validates: Requirements 1.2, 1.4, 2.3**

- [-] 5. Users Module
  - [x] 5.1 Implement Users service and controller
    - Create CRUD endpoints for user management
    - Implement email uniqueness validation
    - Implement role validation (admin/farmer only)
    - Restrict user management to admin role
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 5.2 Write property tests for user management
    - **Property 6: Email Uniqueness Constraint**
    - **Property 7: Role Validation**
    - **Property 9: Profile Update Field Restrictions**
    - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 6. Checkpoint - Verify auth and users modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Farms Module
  - [x] 7.1 Implement Farms service and controller
    - Create CRUD endpoints for farm management
    - Implement owner association validation
    - Implement statistics tracking
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 7.2 Write property tests for farms
    - **Property 30: Farm Owner Association**
    - **Property 31: Farm Statistics Tracking**
    - **Validates: Requirements 12.1, 12.2**

- [x] 8. Barns Module
  - [x] 8.1 Implement Barns service and controller
    - Create CRUD endpoints for barn management
    - Implement barn code uniqueness validation
    - Implement sensor assignment
    - Track current occupancy
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Write property tests for barns
    - **Property 16: Barn Code Uniqueness**
    - **Property 17: Barn Occupancy Accuracy**
    - **Validates: Requirements 5.1, 5.2**

- [x] 9. Livestock Module
  - [x] 9.1 Implement Livestock service and controller
    - Create CRUD endpoints with soft delete
    - Implement QR code UUID generation
    - Implement ear tag uniqueness validation
    - Implement search and filtering
    - Support custom fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 9.2 Write property tests for livestock
    - **Property 11: Ear Tag Uniqueness**
    - **Property 12: Livestock Search Filter Correctness**
    - **Property 13: Soft Delete Preservation**
    - **Property 14: Custom Fields Round-Trip**
    - **Validates: Requirements 3.2, 3.3, 3.5, 3.6**

  - [x] 9.3 Implement public QR code endpoint
    - Create unauthenticated endpoint for QR scan
    - Return livestock details with barn and recent logs
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 9.4 Write property test for public endpoint
    - **Property 15: Public QR Endpoint No Authentication**
    - **Validates: Requirements 4.2**

- [x] 10. Checkpoint - Verify core CRUD modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. WebSocket Gateway
  - [x] 11.1 Implement WebSocket gateway
    - Create gateway with Socket.io
    - Implement room-based subscriptions (per barn)
    - Define event emitters for sensor readings, entry/exit, alerts
    - _Requirements: 6.5, 7.4, 9.1_

- [x] 12. MQTT Module
  - [x] 12.1 Implement MQTT service
    - Connect to Mosquitto broker
    - Subscribe to sensor topics
    - Implement message validation
    - _Requirements: 6.1_

  - [ ]* 12.2 Write property test for MQTT validation
    - **Property 18: MQTT Payload Validation**
    - **Validates: Requirements 6.1**

- [x] 13. Monitoring Module
  - [x] 13.1 Implement Monitoring service and controller
    - Create endpoints for historical readings
    - Create endpoint for latest readings per sensor
    - Implement date range filtering
    - Implement aggregation (hourly, daily, weekly)
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 13.2 Integrate MQTT handler with monitoring
    - Process incoming sensor data
    - Calculate alert level
    - Store readings in database
    - Broadcast via WebSocket
    - Create alerts on danger threshold
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 13.3 Write property tests for monitoring
    - **Property 28: Historical Data Date Filtering**
    - **Property 29: Data Aggregation Correctness**
    - **Validates: Requirements 10.1, 10.2, 10.4**

- [x] 14. Entry/Exit Module
  - [x] 14.1 Implement Entry/Exit service and controller
    - Create endpoint for RFID events
    - Validate livestock and barn existence
    - Create entry/exit logs
    - Calculate duration on exit
    - Update livestock current barn on entry
    - Broadcast via WebSocket
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 14.2 Write property tests for entry/exit
    - **Property 20: RFID Event Validation**
    - **Property 21: Entry Log Creates Barn Assignment**
    - **Property 22: Exit Log Duration Calculation**
    - **Property 23: Entry Exit Log Filtering**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [x] 15. Alerts Module
  - [x] 15.1 Implement Alerts service and controller
    - Create endpoints for listing and filtering alerts
    - Implement acknowledge and resolve actions
    - Track state transitions with timestamps
    - Validate alert types
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_

  - [x] 15.2 Implement email notification service
    - Configure Nodemailer
    - Send email on critical alerts
    - _Requirements: 8.2_

  - [ ]* 15.3 Write property tests for alerts
    - **Property 24: Alert State Transitions**
    - **Property 25: Alert Type Validation**
    - **Property 26: Alert Filtering Correctness**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6**

- [x] 16. Dashboard Statistics Endpoint
  - [x] 16.1 Implement dashboard statistics endpoint
    - Return recent logs (last 10)
    - Return livestock summary by status/species
    - Return barn occupancy overview
    - _Requirements: 9.3, 9.4, 9.5_

  - [ ]* 16.2 Write property test for dashboard statistics
    - **Property 27: Dashboard Statistics Accuracy**
    - **Validates: Requirements 9.3, 9.4, 9.5**

- [x] 17. Checkpoint - Verify all backend modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Frontend Authentication
  - [x] 18.1 Implement auth pages and store
    - Create login page with form
    - Implement useAuthStore with Zustand
    - Set up Axios interceptors for token handling
    - Implement token refresh logic
    - _Requirements: 1.1, 1.3_

  - [x] 18.2 Implement protected route wrapper
    - Create auth middleware for App Router
    - Redirect unauthenticated users to login
    - _Requirements: 2.3_

- [x] 19. Frontend Layout and Navigation
  - [x] 19.1 Implement dashboard layout
    - Create sidebar navigation component
    - Create navbar with user menu
    - Implement responsive collapsible menu
    - _Requirements: 11.1, 11.4_

- [x] 20. Frontend Livestock Pages
  - [x] 20.1 Implement livestock list page
    - Create data table with pagination
    - Implement search and filter controls
    - Add action buttons (view, edit, delete)
    - _Requirements: 3.3_

  - [x] 20.2 Implement livestock detail and form pages
    - Create livestock detail view
    - Create add/edit form with validation
    - Implement photo upload
    - Implement custom fields editor
    - _Requirements: 3.1, 3.6, 3.7_

  - [x] 20.3 Implement QR code generation component
    - Generate QR code image for each livestock
    - Add download/print functionality
    - _Requirements: 4.1_

  - [x] 20.4 Implement public livestock page
    - Create unauthenticated route
    - Display livestock info and recent history
    - _Requirements: 4.2, 4.3_

- [x] 21. Frontend Barn Pages
  - [x] 21.1 Implement barn list and detail pages
    - Create barn list with occupancy indicators
    - Create barn detail with livestock list
    - Implement sensor assignment UI
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 22. Frontend Monitoring Pages
  - [x] 22.1 Implement real-time monitoring dashboard
    - Create sensor cards with live readings
    - Implement WebSocket connection for updates
    - Display alert level indicators
    - _Requirements: 6.5, 9.1_

  - [x] 22.2 Implement historical charts
    - Create line charts for gas levels
    - Add threshold reference lines
    - Implement date range selector
    - Implement aggregation toggle
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 23. Frontend Entry/Exit Logs Page
  - [x] 23.1 Implement logs page
    - Create timeline view of events
    - Implement filtering by livestock/barn/date
    - Show duration for completed visits
    - _Requirements: 7.5_

- [x] 24. Frontend Alerts Page
  - [x] 24.1 Implement alerts page
    - Create alert list with severity indicators
    - Implement acknowledge/resolve actions
    - Add filtering by status/severity
    - _Requirements: 8.3, 8.4, 8.6_

  - [x] 24.2 Implement alert banner component
    - Display active critical alerts
    - Show in dashboard header
    - _Requirements: 9.2_

- [x] 25. Frontend Dashboard Page
  - [x] 25.1 Implement main dashboard
    - Display summary statistics widgets
    - Show recent entry/exit logs
    - Show barn occupancy cards
    - Integrate alert banner
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 26. Frontend Mobile Optimization
  - [x] 26.1 Implement QR scanner component
    - Integrate camera-based QR scanning
    - Navigate to livestock page on scan
    - _Requirements: 11.2_

  - [x] 26.2 Verify responsive design
    - Test all pages on mobile viewport
    - Ensure touch-friendly controls
    - _Requirements: 11.1, 11.3_

- [x] 27. Checkpoint - Verify frontend implementation
  - Ensure all pages render correctly, ask the user if questions arise.

- [x] 28. Python Simulator
  - [x] 28.1 Implement gas sensor simulator
    - Create MQTT publisher for gas readings
    - Generate realistic sensor data with variations
    - Support configurable number of sensors
    - _Requirements: Simulator for testing_

  - [x] 28.2 Implement RFID reader simulator
    - Create HTTP client for entry/exit events
    - Simulate random livestock movements
    - _Requirements: Simulator for testing_

- [x] 29. Final Integration and Testing
  - [x] 29.1 End-to-end integration testing
    - Test complete flow: sensor → backend → frontend
    - Test RFID flow: reader → backend → frontend
    - Verify WebSocket real-time updates
    - _Requirements: All_

- [x] 30. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Backend and frontend can be developed in parallel after task 6
