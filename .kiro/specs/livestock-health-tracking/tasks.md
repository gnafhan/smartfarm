# Implementation Plan: Livestock Health Tracking

## Overview

This implementation plan breaks down the livestock health tracking feature into discrete, incremental tasks. Each task builds on previous work, ensuring continuous integration and early validation. The plan covers backend API development, database schemas, frontend components, and comprehensive testing.

## Tasks

- [x] 1. Create Health Events Database Schema and Module Setup
  - Create `health-event.schema.ts` with HealthEvent model including all event types (vaccination, examination, disease)
  - Add indexes for efficient queries: `{ livestockId: 1, eventDate: -1 }`, `{ eventType: 1, nextDueDate: 1 }`
  - Create `health-events` module with service, controller, and DTOs
  - Set up module imports in `app.module.ts`
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for health event persistence
  - **Property 1: Health Event Persistence and Retrieval**
  - **Validates: Requirements 1.1, 5.1, 6.1, 6.2**

- [x] 2. Implement Health Events Service Core Methods
  - [x] 2.1 Implement `create()` method with validation for all event types
    - Validate livestock exists
    - Validate event date is not in future
    - Validate event-type-specific required fields
    - Store event in database
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property test for future date rejection
    - **Property 3: Future Date Rejection**
    - **Validates: Requirements 1.3, 2.3**

  - [ ]* 2.3 Write property test for event-type-specific validation
    - **Property 5: Event-Type-Specific Required Fields**
    - **Validates: Requirements 1.4, 1.5, 1.6**

  - [x] 2.4 Implement `findByLivestock()` method with filtering
    - Support filtering by event type
    - Support date range filtering
    - Return results in chronological order
    - Implement pagination
    - _Requirements: 1.2, 1.7, 1.8_

  - [ ]* 2.5 Write property test for event type filtering
    - **Property 7: Event Type Filtering**
    - **Validates: Requirements 1.7, 6.6**

  - [ ]* 2.6 Write property test for date range filtering
    - **Property 8: Date Range Filtering**
    - **Validates: Requirements 1.8, 3.7**

  - [ ]* 2.7 Write property test for chronological ordering
    - **Property 6: Chronological Ordering**
    - **Validates: Requirements 1.2, 2.4**

  - [x] 2.8 Implement `findOne()`, `update()`, and `remove()` methods
    - Handle not found errors appropriately
    - _Requirements: 1.1_

  - [ ]* 2.9 Write property test for not found error handling
    - **Property 18: Not Found Error Handling**
    - **Validates: Requirements 6.8**

- [x] 3. Create Health Events API Endpoints
  - [x] 3.1 Implement POST `/livestock/:livestockId/health-events` endpoint
    - Validate request body using DTOs
    - Return HTTP 201 with created resource
    - Handle validation errors with HTTP 400
    - _Requirements: 6.1, 6.7_

  - [ ]* 3.2 Write property test for invalid data rejection
    - **Property 17: Invalid Data Rejection**
    - **Validates: Requirements 6.7**

  - [x] 3.3 Implement GET `/livestock/:livestockId/health-events` endpoint
    - Support query parameters for filtering and pagination
    - Return paginated results with metadata
    - _Requirements: 6.2, 6.5, 6.6_

  - [ ]* 3.4 Write property test for pagination correctness
    - **Property 16: Pagination Correctness**
    - **Validates: Requirements 6.5**

  - [x] 3.5 Implement GET, PATCH, DELETE endpoints for individual health events
    - GET `/livestock/:livestockId/health-events/:id`
    - PATCH `/livestock/:livestockId/health-events/:id`
    - DELETE `/livestock/:livestockId/health-events/:id`
    - _Requirements: 1.1_

- [x] 4. Checkpoint - Health Events Module Complete
  - Ensure all health events tests pass
  - Verify API endpoints work correctly with Postman/Insomnia
  - Ask the user if questions arise

- [x] 5. Create Weight Entries Database Schema and Module Setup
  - Create `weight-entry.schema.ts` with WeightEntry model
  - Add indexes: `{ livestockId: 1, measurementDate: -1 }`, `{ measurementDate: 1 }`
  - Create `weight-entries` module with service, controller, and DTOs
  - Set up module imports in `app.module.ts`
  - _Requirements: 2.1_

- [ ]* 5.1 Write property test for weight entry persistence
  - **Property 2: Weight Entry Persistence and Retrieval**
  - **Validates: Requirements 2.1, 5.2, 6.3, 6.4**

- [x] 6. Implement Weight Entries Service Core Methods
  - [x] 6.1 Implement `create()` method with validation
    - Validate livestock exists
    - Validate weight is positive
    - Validate measurement date is not in future
    - Store entry in database
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 6.2 Write property test for positive weight validation
    - **Property 4: Positive Weight Validation**
    - **Validates: Requirements 2.2**

  - [x] 6.3 Implement `findByLivestock()` method
    - Support date range filtering
    - Return results in chronological order
    - Implement pagination
    - _Requirements: 2.4_

  - [x] 6.4 Implement `update()` and `remove()` methods
    - Update weight and notes
    - Remove entry from database
    - _Requirements: 2.5, 2.6_

  - [ ]* 6.5 Write property test for weight entry deletion
    - **Property 9: Weight Entry Deletion**
    - **Validates: Requirements 2.5**

  - [ ]* 6.6 Write property test for weight entry update
    - **Property 10: Weight Entry Update**
    - **Validates: Requirements 2.6**

  - [x] 6.7 Implement `getLatestWeight()` method
    - Return most recent weight entry for a livestock
    - _Requirements: 2.1_

- [x] 7. Create Weight Entries API Endpoints
  - [x] 7.1 Implement POST `/livestock/:livestockId/weight-entries` endpoint
    - Validate request body
    - Return HTTP 201 with created resource
    - _Requirements: 6.3_

  - [x] 7.2 Implement GET `/livestock/:livestockId/weight-entries` endpoint
    - Support filtering and pagination
    - _Requirements: 6.4, 6.5_

  - [x] 7.3 Implement GET, PATCH, DELETE endpoints for individual weight entries
    - GET `/livestock/:livestockId/weight-entries/:id`
    - PATCH `/livestock/:livestockId/weight-entries/:id`
    - DELETE `/livestock/:livestockId/weight-entries/:id`
    - _Requirements: 2.5, 2.6_

  - [x] 7.4 Implement GET `/livestock/:livestockId/weight-entries/latest` endpoint
    - Return most recent weight entry
    - _Requirements: 2.1_

- [x] 8. Implement Weight Chart Data Integration
  - [x] 8.1 Create `getWeightChartData()` method in WeightEntriesService
    - Fetch weight entries for date range
    - Fetch temperature readings from MonitoringService
    - Fetch methane readings from MonitoringService
    - Combine data into WeightChartDataDto
    - Handle missing environmental data gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

  - [ ]* 8.2 Write property test for weight chart data structure
    - **Property 11: Weight Chart Data Structure**
    - **Validates: Requirements 3.1**

  - [ ]* 8.3 Write property test for environmental data overlay
    - **Property 12: Environmental Data Overlay**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 8.4 Write property test for data series labeling
    - **Property 13: Data Series Labeling**
    - **Validates: Requirements 3.4**

  - [ ]* 8.5 Write property test for missing environmental data handling
    - **Property 14: Graceful Handling of Missing Environmental Data**
    - **Validates: Requirements 3.6**

  - [x] 8.6 Add helper methods to MonitoringService
    - Implement `getMethaneReadingsForPeriod()` method
    - Implement `getTemperatureReadingsForPeriod()` method
    - Support daily and hourly aggregation
    - _Requirements: 3.2, 3.3_

  - [x] 8.7 Create GET `/livestock/:livestockId/weight-entries/chart-data` endpoint
    - Accept startDate and endDate query parameters
    - Return WeightChartDataDto
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 9. Checkpoint - Weight Tracking Module Complete
  - Ensure all weight tracking tests pass
  - Verify chart data endpoint returns correct structure
  - Ask the user if questions arise

- [x] 10. Update Monitoring Module for Backward Compatibility
  - [x] 10.1 Add new endpoints for methane and temperature chart data
    - GET `/monitoring/methane-chart-data`
    - GET `/monitoring/temperature-chart-data`
    - Both accept barnId, startDate, endDate, aggregation parameters
    - _Requirements: 3.2, 3.3_

  - [x] 10.2 Verify existing monitoring endpoints still accept all gas types
    - Ensure no filtering is applied to incoming sensor data
    - Ensure all gas types are stored in database
    - Ensure queries can retrieve all gas types
    - _Requirements: 4.4, 4.5, 4.6, 4.7_

  - [ ]* 10.3 Write property test for gas type backward compatibility
    - **Property 15: Backend Gas Type Backward Compatibility**
    - **Validates: Requirements 4.4, 4.5, 4.6, 4.7**

- [x] 11. Create Frontend Health History Component
  - [x] 11.1 Create `LivestockHealthHistory.tsx` component
    - Display health events in timeline/list view
    - Show event type badges with different colors
    - Display all event-specific fields
    - Implement filtering by event type
    - Implement date range filtering
    - _Requirements: 1.2, 1.7, 1.8_

  - [x] 11.2 Create `AddHealthEventForm.tsx` component
    - Form with event type selector
    - Conditional fields based on event type
    - Date picker with future date validation
    - Submit to POST endpoint
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [x] 11.3 Integrate health history into livestock detail page
    - Add new tab or section for health history
    - Wire up API calls to backend
    - Handle loading and error states
    - _Requirements: 1.2_

- [x] 12. Create Frontend Weight Tracking Component
  - [x] 12.1 Create `WeightHistoryTable.tsx` component
    - Display weight entries in table format
    - Show measurement date, weight, and notes
    - Support sorting by date
    - Implement edit and delete actions
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 12.2 Create `AddWeightEntryForm.tsx` component
    - Form with weight input (positive number validation)
    - Date picker with future date validation
    - Notes textarea
    - Submit to POST endpoint
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 12.3 Create `WeightChart.tsx` component
    - Fetch chart data from backend
    - Render weight as primary line chart using Recharts
    - Overlay temperature as secondary line
    - Overlay methane as tertiary line
    - Use distinct colors for each metric
    - Add legend with labels
    - Implement date range selector
    - Show tooltips on hover with exact values
    - Handle missing environmental data gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 12.4 Integrate weight tracking into livestock detail page
    - Add new tab or section for weight tracking
    - Display both chart and table views
    - Wire up API calls to backend
    - _Requirements: 2.1, 3.1_

- [x] 13. Update Monitoring Dashboard UI
  - [x] 13.1 Modify monitoring dashboard to show only methane
    - Remove CO2, NH3, H2S from display components
    - Update charts to show only methane readings
    - Update statistics cards to show only methane
    - Keep all existing methane functionality
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 13.2 Update API calls to request only methane data
    - Modify frontend queries to filter for methane
    - Ensure backend still stores all gas types
    - _Requirements: 4.3, 4.4_

- [x] 14. Add Data Validation and Error Handling
  - [x] 14.1 Create custom validator decorators
    - `@IsNotFutureDate()` decorator for date validation
    - Apply to health event and weight entry DTOs
    - _Requirements: 1.3, 2.3_

  - [x] 14.2 Implement comprehensive error handling
    - Return HTTP 400 for validation errors with details
    - Return HTTP 404 for not found resources
    - Return HTTP 500 for database errors with safe messages
    - _Requirements: 5.3, 5.4, 6.7, 6.8_

  - [x] 14.3 Add referential integrity handling
    - Decide on cascade delete or prevent delete for livestock with health events
    - Decide on cascade delete or prevent delete for livestock with weight entries
    - Implement chosen strategy
    - _Requirements: 5.5, 5.6_

- [ ]* 14.4 Write unit tests for error scenarios
  - Test database failure handling
  - Test referential integrity scenarios
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 15. Final Integration and Testing
  - [x] 15.1 Run all property-based tests
    - Ensure all 18 properties pass with 100+ iterations
    - Fix any failing tests
    - _All Requirements_

  - [x] 15.2 Run integration tests
    - Test complete workflows end-to-end
    - Test health event creation and retrieval
    - Test weight tracking with chart data
    - Test monitoring dashboard with methane only
    - _All Requirements_

  - [x] 15.3 Manual testing
    - Test all UI components in browser
    - Verify forms work correctly
    - Verify charts render properly
    - Verify filtering and pagination
    - Test error handling and edge cases
    - _All Requirements_

- [x] 16. Final Checkpoint
  - Ensure all tests pass
  - Verify all requirements are met
  - Ask the user for final review and feedback

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend tasks should be completed before frontend tasks
- All property tests should use fast-check library with minimum 100 iterations
