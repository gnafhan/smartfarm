# Design Document: Livestock Health Tracking

## Overview

This design extends the existing livestock monitoring system with comprehensive health tracking and weight management capabilities. The system will maintain detailed health records (vaccinations, examinations, diseases) and weight measurements over time, with integrated visualization of weight trends alongside environmental data (temperature and methane). The monitoring interface will be simplified to focus on methane readings while maintaining full backward compatibility for other gas types in the backend.

### Key Design Principles

1. **Data Integrity**: All health and weight records are immutable once created (append-only)
2. **Backward Compatibility**: Backend continues to accept and store all gas types
3. **Separation of Concerns**: Health, weight, and monitoring features are independent modules
4. **Performance**: Efficient queries for time-series data visualization
5. **Extensibility**: Schema design supports future health event types

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Livestock Detail Page  │  Weight Chart  │  Monitoring UI   │
│  - Health History       │  - Weight Line │  - Methane Only  │
│  - Weight History       │  - Temp Overlay│                  │
│                         │  - CH4 Overlay │                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Health Module  │  Weight Module  │  Monitoring Module      │
│  - CRUD Events  │  - CRUD Entries │  - All Gas Types (API)  │
│  - Filtering    │  - Time Series  │  - Methane Filter (UI)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  health_events  │  weight_entries  │  gas_sensor_readings   │
│  Collection     │  Collection      │  Collection            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: NestJS (TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Next.js (React) with TypeScript
- **Charts**: Recharts or Chart.js for visualization
- **Validation**: class-validator, class-transformer

## Components and Interfaces

### 1. Health Events Module

#### Schema: HealthEvent

```typescript
interface HealthEvent {
  _id: ObjectId;
  livestockId: ObjectId;  // Reference to Livestock
  eventType: 'vaccination' | 'examination' | 'disease';
  eventDate: Date;
  description: string;
  
  // Vaccination-specific fields
  vaccineName?: string;
  nextDueDate?: Date;
  
  // Examination-specific fields
  veterinarianName?: string;
  findings?: string;
  
  // Disease-specific fields
  diseaseName?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  treatmentPlan?: string;
  
  // Metadata
  createdBy?: ObjectId;  // User who created the record
  createdAt: Date;
  updatedAt: Date;
}
```

#### Service: HealthEventsService

```typescript
class HealthEventsService {
  // Create a new health event
  async create(dto: CreateHealthEventDto): Promise<HealthEventResponseDto>
  
  // Get all health events for a livestock
  async findByLivestock(
    livestockId: string,
    filters?: HealthEventFilterDto
  ): Promise<PaginatedResponse<HealthEventResponseDto>>
  
  // Get a single health event
  async findOne(id: string): Promise<HealthEventResponseDto>
  
  // Update a health event (limited fields)
  async update(id: string, dto: UpdateHealthEventDto): Promise<HealthEventResponseDto>
  
  // Delete a health event
  async remove(id: string): Promise<void>
  
  // Get upcoming vaccinations (nextDueDate in future)
  async getUpcomingVaccinations(
    farmId: string,
    daysAhead: number
  ): Promise<HealthEventResponseDto[]>
}
```

#### Controller: HealthEventsController

```typescript
@Controller('livestock/:livestockId/health-events')
class HealthEventsController {
  @Post()
  create(@Param('livestockId') livestockId: string, @Body() dto: CreateHealthEventDto)
  
  @Get()
  findAll(@Param('livestockId') livestockId: string, @Query() filters: HealthEventFilterDto)
  
  @Get(':id')
  findOne(@Param('id') id: string)
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHealthEventDto)
  
  @Delete(':id')
  remove(@Param('id') id: string)
}

@Controller('health-events')
class HealthEventsGlobalController {
  @Get('upcoming-vaccinations')
  getUpcomingVaccinations(@Query('farmId') farmId: string, @Query('days') days: number)
}
```

### 2. Weight Tracking Module

#### Schema: WeightEntry

```typescript
interface WeightEntry {
  _id: ObjectId;
  livestockId: ObjectId;  // Reference to Livestock
  weight: number;         // in kilograms
  measurementDate: Date;
  notes?: string;
  
  // Metadata
  recordedBy?: ObjectId;  // User who recorded the weight
  createdAt: Date;
  updatedAt: Date;
}
```

#### Service: WeightEntriesService

```typescript
class WeightEntriesService {
  // Create a new weight entry
  async create(dto: CreateWeightEntryDto): Promise<WeightEntryResponseDto>
  
  // Get all weight entries for a livestock
  async findByLivestock(
    livestockId: string,
    filters?: WeightEntryFilterDto
  ): Promise<PaginatedResponse<WeightEntryResponseDto>>
  
  // Get weight entries with environmental data for charting
  async getWeightChartData(
    livestockId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WeightChartDataDto>
  
  // Get a single weight entry
  async findOne(id: string): Promise<WeightEntryResponseDto>
  
  // Update a weight entry
  async update(id: string, dto: UpdateWeightEntryDto): Promise<WeightEntryResponseDto>
  
  // Delete a weight entry
  async remove(id: string): Promise<void>
  
  // Get latest weight for a livestock
  async getLatestWeight(livestockId: string): Promise<WeightEntryResponseDto | null>
  
  // Calculate average daily gain
  async calculateAverageDailyGain(
    livestockId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number>
}
```

#### Controller: WeightEntriesController

```typescript
@Controller('livestock/:livestockId/weight-entries')
class WeightEntriesController {
  @Post()
  create(@Param('livestockId') livestockId: string, @Body() dto: CreateWeightEntryDto)
  
  @Get()
  findAll(@Param('livestockId') livestockId: string, @Query() filters: WeightEntryFilterDto)
  
  @Get('chart-data')
  getChartData(
    @Param('livestockId') livestockId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  )
  
  @Get('latest')
  getLatest(@Param('livestockId') livestockId: string)
  
  @Get(':id')
  findOne(@Param('id') id: string)
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWeightEntryDto)
  
  @Delete(':id')
  remove(@Param('id') id: string)
}
```

### 3. Monitoring Module Updates

#### Service: MonitoringService (Modified)

```typescript
class MonitoringService {
  // Existing methods remain unchanged
  
  // New method: Get methane readings for weight chart overlay
  async getMethaneReadingsForPeriod(
    barnId: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'hourly' | 'daily' = 'daily'
  ): Promise<MethaneReadingDto[]>
  
  // New method: Get temperature readings for weight chart overlay
  async getTemperatureReadingsForPeriod(
    barnId: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'hourly' | 'daily' = 'daily'
  ): Promise<TemperatureReadingDto[]>
}
```

#### Controller: MonitoringController (Modified)

```typescript
@Controller('monitoring')
class MonitoringController {
  // Existing endpoints remain unchanged
  
  // New endpoint: Get methane data for charts
  @Get('methane-chart-data')
  getMethaneChartData(
    @Query('barnId') barnId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('aggregation') aggregation?: string
  )
  
  // New endpoint: Get temperature data for charts
  @Get('temperature-chart-data')
  getTemperatureChartData(
    @Query('barnId') barnId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('aggregation') aggregation?: string
  )
}
```

### 4. Frontend Components

#### LivestockHealthHistory Component

```typescript
interface LivestockHealthHistoryProps {
  livestockId: string;
}

// Displays health events in a timeline view
// Allows filtering by event type
// Provides forms for adding new events
```

#### WeightChartComponent

```typescript
interface WeightChartProps {
  livestockId: string;
  barnId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Displays weight as primary line chart
// Overlays temperature as secondary line
// Overlays methane as tertiary line
// Supports date range selection
// Shows tooltips with exact values
```

#### MonitoringDashboard Component (Modified)

```typescript
// Remove display of CO2, NH3, H2S from UI
// Show only methane readings
// Keep all existing functionality for methane
```

## Data Models

### CreateHealthEventDto

```typescript
class CreateHealthEventDto {
  @IsEnum(['vaccination', 'examination', 'disease'])
  eventType: string;
  
  @IsDateString()
  @IsNotFutureDate()
  eventDate: string;
  
  @IsString()
  @IsNotEmpty()
  description: string;
  
  // Vaccination fields
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.eventType === 'vaccination')
  @IsNotEmpty()
  vaccineName?: string;
  
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
  
  // Examination fields
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.eventType === 'examination')
  @IsNotEmpty()
  veterinarianName?: string;
  
  @IsOptional()
  @IsString()
  findings?: string;
  
  // Disease fields
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.eventType === 'disease')
  @IsNotEmpty()
  diseaseName?: string;
  
  @IsOptional()
  @IsEnum(['mild', 'moderate', 'severe'])
  severity?: string;
  
  @IsOptional()
  @IsString()
  treatmentPlan?: string;
}
```

### CreateWeightEntryDto

```typescript
class CreateWeightEntryDto {
  @IsNumber()
  @IsPositive()
  weight: number;
  
  @IsDateString()
  @IsNotFutureDate()
  measurementDate: string;
  
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### WeightChartDataDto

```typescript
class WeightChartDataDto {
  weightData: Array<{
    date: Date;
    weight: number;
  }>;
  
  temperatureData: Array<{
    date: Date;
    temperature: number;
  }>;
  
  methaneData: Array<{
    date: Date;
    methanePpm: number;
  }>;
}
```

### HealthEventFilterDto

```typescript
class HealthEventFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['vaccination', 'examination', 'disease'])
  eventType?: string;
  
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

### WeightEntryFilterDto

```typescript
class WeightEntryFilterDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

## Database Indexes

### HealthEvent Collection

```typescript
// Compound index for efficient livestock queries
{ livestockId: 1, eventDate: -1 }

// Index for vaccination due date queries
{ eventType: 1, nextDueDate: 1 }

// Index for date range queries
{ eventDate: 1 }
```

### WeightEntry Collection

```typescript
// Compound index for efficient livestock queries
{ livestockId: 1, measurementDate: -1 }

// Index for date range queries
{ measurementDate: 1 }
```

### GasSensorReading Collection (Existing)

```typescript
// Existing indexes remain unchanged
// No modifications needed for backward compatibility
```

## Error Handling

### Validation Errors

1. **Future Date Validation**: Reject health events and weight entries with future dates
   - HTTP 400: "Event date cannot be in the future"
   - HTTP 400: "Measurement date cannot be in the future"

2. **Negative Weight Validation**: Reject weight entries with non-positive values
   - HTTP 400: "Weight must be a positive number"

3. **Required Field Validation**: Enforce conditional required fields based on event type
   - HTTP 400: "Vaccine name is required for vaccination events"
   - HTTP 400: "Veterinarian name is required for examination events"
   - HTTP 400: "Disease name is required for disease events"

### Not Found Errors

1. **Livestock Not Found**: When creating events/entries for non-existent livestock
   - HTTP 404: "Livestock not found"

2. **Event/Entry Not Found**: When updating or deleting non-existent records
   - HTTP 404: "Health event not found"
   - HTTP 404: "Weight entry not found"

### Database Errors

1. **Connection Failures**: Handle MongoDB connection issues gracefully
   - HTTP 500: "Database connection error"

2. **Constraint Violations**: Handle unique constraint violations
   - HTTP 409: "Duplicate entry detected"

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **DTO Validation Tests**
   - Test valid health event creation for each type
   - Test invalid date validation (future dates)
   - Test negative weight rejection
   - Test required field validation per event type

2. **Service Method Tests**
   - Test CRUD operations with mock repositories
   - Test filtering logic with various parameters
   - Test chart data aggregation logic
   - Test error handling for not found cases

3. **Controller Tests**
   - Test request/response mapping
   - Test parameter validation
   - Test error response formatting

### Property-Based Testing

Property-based tests will verify universal correctness properties across all inputs. Each test will run a minimum of 100 iterations with randomized inputs.

The testing framework will be **fast-check** for TypeScript/JavaScript property-based testing.

### Integration Testing

1. **API Integration Tests**
   - Test complete request/response cycles
   - Test database persistence
   - Test referential integrity

2. **Frontend Integration Tests**
   - Test chart rendering with various data sets
   - Test form submission and validation
   - Test filtering and pagination

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: livestock-health-tracking, Property {N}: {description}**
- Use MongoDB in-memory server for integration tests
- Mock external dependencies (email, notifications)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Health Event Persistence and Retrieval

*For any* valid health event (vaccination, examination, or disease) with all required fields, creating the event through the API should result in the event being stored in the database with all fields intact, and a subsequent GET request for that livestock's health events should include the created event.

**Validates: Requirements 1.1, 5.1, 6.1, 6.2**

### Property 2: Weight Entry Persistence and Retrieval

*For any* valid weight entry with positive weight and non-future date, creating the entry through the API should result in the entry being stored in the database with all fields intact, and a subsequent GET request for that livestock's weight entries should include the created entry.

**Validates: Requirements 2.1, 5.2, 6.3, 6.4**

### Property 3: Future Date Rejection

*For any* date in the future, attempting to create a health event or weight entry with that date should be rejected with an HTTP 400 error and an appropriate validation message.

**Validates: Requirements 1.3, 2.3**

### Property 4: Positive Weight Validation

*For any* non-positive number (zero or negative), attempting to create a weight entry with that weight value should be rejected with an HTTP 400 error indicating that weight must be positive.

**Validates: Requirements 2.2**

### Property 5: Event-Type-Specific Required Fields

*For any* health event, if the event type is "vaccination" then vaccine name must be provided, if the event type is "examination" then veterinarian name must be provided, and if the event type is "disease" then disease name and severity must be provided, otherwise the API should reject the request with HTTP 400.

**Validates: Requirements 1.4, 1.5, 1.6**

### Property 6: Chronological Ordering

*For any* set of health events or weight entries for a livestock, when retrieved from the API, the results should be ordered by date in chronological order (oldest to newest or newest to oldest based on sort parameter).

**Validates: Requirements 1.2, 2.4**

### Property 7: Event Type Filtering

*For any* livestock with multiple health events of different types, when filtering by a specific event type, all returned events should match that type and no events of other types should be included.

**Validates: Requirements 1.7, 6.6**

### Property 8: Date Range Filtering

*For any* date range (startDate, endDate), when querying health events or weight entries within that range, all returned records should have dates that fall within the specified range (inclusive).

**Validates: Requirements 1.8, 3.7**

### Property 9: Weight Entry Deletion

*For any* weight entry that exists in the database, deleting it through the API should result in the entry no longer being retrievable, and subsequent GET requests should not include the deleted entry.

**Validates: Requirements 2.5**

### Property 10: Weight Entry Update

*For any* existing weight entry, updating it with new weight and/or notes should result in the stored values being changed, and subsequent GET requests should return the updated values.

**Validates: Requirements 2.6**

### Property 11: Weight Chart Data Structure

*For any* livestock with weight entries, requesting chart data should return a data structure containing weight measurements with dates, and the structure should be suitable for rendering as a time-series chart.

**Validates: Requirements 3.1**

### Property 12: Environmental Data Overlay

*For any* livestock in a barn with weight entries and environmental sensor readings in the same time period, requesting weight chart data should include both temperature and methane readings from that period, aligned by date.

**Validates: Requirements 3.2, 3.3**

### Property 13: Data Series Labeling

*For any* weight chart data response containing multiple metrics (weight, temperature, methane), each data series should have a distinct label identifying the metric type.

**Validates: Requirements 3.4**

### Property 14: Graceful Handling of Missing Environmental Data

*For any* livestock with weight entries but no environmental data in the same time period, requesting weight chart data should successfully return the weight data without failing, with empty arrays for temperature and methane data.

**Validates: Requirements 3.6**

### Property 15: Backend Gas Type Backward Compatibility

*For any* gas sensor reading containing methane, CO2, NH3, and H2S values, the backend API should accept, validate, and store all gas types without filtering, and subsequent queries should be able to retrieve all gas types when requested.

**Validates: Requirements 4.4, 4.5, 4.6, 4.7**

### Property 16: Pagination Correctness

*For any* collection of health events or weight entries, when requesting with pagination parameters (page, limit), the API should return exactly 'limit' items (or fewer on the last page), along with metadata indicating total count, current page, and total pages.

**Validates: Requirements 6.5**

### Property 17: Invalid Data Rejection

*For any* invalid health event or weight entry payload (missing required fields, wrong data types, invalid enum values), the API should reject the request with HTTP 400 and include specific validation error details in the response.

**Validates: Requirements 6.7**

### Property 18: Not Found Error Handling

*For any* request for a non-existent health event, weight entry, or livestock, the API should return HTTP 404 with an appropriate error message indicating the resource was not found.

**Validates: Requirements 6.8**
