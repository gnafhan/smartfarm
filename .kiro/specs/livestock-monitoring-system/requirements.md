# Requirements Document

## Introduction

The Livestock IoT Monitoring & Management System is a comprehensive solution for monitoring gas levels in livestock barns via IoT sensors, managing livestock data with QR/RFID tracking, tracking entry/exit activity automatically via RFID, and providing a real-time dashboard for farm monitoring. The system targets Admin and Farmer users and will be deployed on a single VPS Ubuntu environment.

## Glossary

- **System**: The Livestock IoT Monitoring & Management System
- **Livestock**: Individual farm animals (cattle, goat, sheep, etc.) tracked in the system
- **Barn**: A physical structure housing livestock with associated sensors
- **Gas_Sensor**: IoT device measuring Methane, CO2, NH3, temperature, and humidity
- **RFID_Reader**: Device that reads RFID tags on livestock for entry/exit tracking
- **Alert**: System-generated notification when thresholds are breached
- **QR_Code**: Unique identifier encoded as a scannable QR image for each livestock
- **Entry_Exit_Log**: Record of livestock movement in/out of barns
- **Admin**: User with full system access including user management
- **Farmer**: User with access to livestock, barn, and monitoring features
- **WebSocket**: Real-time bidirectional communication protocol
- **MQTT**: Message Queuing Telemetry Transport protocol for IoT sensor data

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely authenticate to the system, so that I can access features appropriate to my role.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THE System SHALL return a JWT access token and refresh token
2. WHEN a user submits invalid credentials, THE System SHALL return an authentication error without revealing which credential was incorrect
3. WHEN an access token expires, THE System SHALL allow token refresh using a valid refresh token
4. WHEN a refresh token is invalid or expired, THE System SHALL require re-authentication
5. THE System SHALL hash all passwords before storage using bcrypt
6. WHEN a user requests their profile, THE System SHALL return user details excluding the password

### Requirement 2: User Management

**User Story:** As an admin, I want to manage user accounts, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN an admin creates a new user, THE System SHALL validate email uniqueness and create the user with the specified role
2. WHEN an admin assigns a role, THE System SHALL restrict roles to "admin" or "farmer"
3. THE System SHALL enforce role-based access where farmers cannot access user management features
4. WHEN a user updates their profile, THE System SHALL allow modification of name and password only

### Requirement 3: Livestock Management

**User Story:** As a farmer, I want to manage livestock records, so that I can track and maintain information about each animal.

#### Acceptance Criteria

1. WHEN a user creates a new livestock record, THE System SHALL generate a unique UUID for the QR code
2. WHEN a user creates livestock, THE System SHALL validate that the ear tag ID is unique
3. WHEN a user views the livestock list, THE System SHALL support pagination, search by name/ear tag, and filtering by species/status/barn
4. WHEN a user updates livestock information, THE System SHALL preserve the original QR code UUID
5. WHEN a user deletes livestock, THE System SHALL perform a soft delete by setting status to inactive
6. THE System SHALL support custom fields as key-value pairs for extensibility
7. WHEN a user uploads photos, THE System SHALL store references and support multiple photos per livestock

### Requirement 4: QR Code System

**User Story:** As a farmer, I want each livestock to have a unique QR code, so that I can quickly access animal information by scanning.

#### Acceptance Criteria

1. THE System SHALL generate a QR code image for each livestock containing the URL format: `{domain}/livestock/{uuid}`
2. WHEN a QR code is scanned, THE System SHALL display livestock information without requiring authentication
3. WHEN displaying public livestock info, THE System SHALL show basic details, current barn, and recent entry/exit history
4. THE System SHALL ensure QR code UUIDs are immutable once created

### Requirement 5: Barn Management

**User Story:** As a farmer, I want to manage barn information, so that I can organize livestock housing and monitor capacity.

#### Acceptance Criteria

1. WHEN a user creates a barn, THE System SHALL validate that the barn code is unique
2. THE System SHALL track current occupancy based on livestock assignments
3. WHEN a user views barn details, THE System SHALL display assigned sensors and current livestock
4. WHEN a user assigns a sensor to a barn, THE System SHALL validate the sensor ID exists
5. IF barn capacity is exceeded, THEN THE System SHALL display a warning but allow the assignment

### Requirement 6: Gas Monitoring via MQTT

**User Story:** As a farmer, I want to monitor gas levels in barns in real-time, so that I can ensure animal safety and welfare.

#### Acceptance Criteria

1. WHEN the MQTT handler receives sensor data, THE System SHALL validate the payload structure and sensor ID
2. WHEN valid sensor data is received, THE System SHALL store the reading with barn reference and timestamp
3. THE System SHALL calculate alert level based on thresholds: Methane (normal: 0-500, warning: 500-1000, danger: >1000 ppm), CO2 (normal: 0-2000, warning: 2000-3000, danger: >3000 ppm), NH3 (normal: 0-15, warning: 15-25, danger: >25 ppm)
4. WHEN any gas reading exceeds danger threshold, THE System SHALL create an alert and send email notification
5. THE System SHALL broadcast new readings via WebSocket for real-time dashboard updates
6. THE System SHALL automatically delete sensor readings older than 90 days using TTL

### Requirement 7: Entry/Exit Logging via RFID

**User Story:** As a farmer, I want automatic tracking of livestock movement, so that I can monitor animal activity and location.

#### Acceptance Criteria

1. WHEN an RFID event is received, THE System SHALL validate the livestock ID and barn ID exist
2. WHEN a livestock enters a barn, THE System SHALL create an entry log and update the livestock's current barn
3. WHEN a livestock exits a barn, THE System SHALL create an exit log and calculate duration since last entry
4. THE System SHALL broadcast entry/exit events via WebSocket for real-time updates
5. WHEN viewing logs, THE System SHALL support filtering by livestock ID, barn ID, and date range

### Requirement 8: Alert System

**User Story:** As a farmer, I want to receive alerts when conditions are dangerous, so that I can take immediate action.

#### Acceptance Criteria

1. WHEN gas levels exceed danger thresholds, THE System SHALL automatically create an alert with severity "critical"
2. WHEN an alert is created with severity "critical", THE System SHALL send email notification to all farmers associated with the farm
3. WHEN a user acknowledges an alert, THE System SHALL update status to "acknowledged" with timestamp
4. WHEN a user resolves an alert, THE System SHALL update status to "resolved" with timestamp
5. THE System SHALL support alert types: gas_level, system, and livestock
6. WHEN viewing alerts, THE System SHALL allow filtering by status (active, acknowledged, resolved) and severity

### Requirement 9: Real-time Dashboard

**User Story:** As a farmer, I want a real-time dashboard, so that I can monitor farm status at a glance.

#### Acceptance Criteria

1. THE System SHALL display current gas sensor readings updated in real-time via WebSocket
2. THE System SHALL display active alerts with visual distinction by severity
3. THE System SHALL display recent entry/exit logs (last 10 events)
4. THE System SHALL display livestock summary statistics (total, by status, by species)
5. THE System SHALL display barn occupancy overview with capacity indicators
6. WHEN WebSocket connection is lost, THE System SHALL attempt automatic reconnection and display connection status

### Requirement 10: Historical Data and Charts

**User Story:** As a farmer, I want to view historical sensor data, so that I can analyze trends and patterns.

#### Acceptance Criteria

1. WHEN a user requests historical data, THE System SHALL return sensor readings within the specified date range
2. THE System SHALL support aggregation by hour, day, or week for chart display
3. WHEN displaying charts, THE System SHALL show threshold lines for warning and danger levels
4. THE System SHALL allow filtering historical data by sensor ID and barn ID

### Requirement 11: Mobile Responsiveness

**User Story:** As a farmer, I want to access the system from my mobile device, so that I can monitor the farm while in the field.

#### Acceptance Criteria

1. THE System SHALL render all pages responsively for mobile, tablet, and desktop viewports
2. THE System SHALL support QR code scanning via device camera on mobile
3. THE System SHALL provide touch-friendly interface elements with appropriate sizing
4. WHEN on mobile, THE System SHALL use a collapsible navigation menu

### Requirement 12: Farm Management

**User Story:** As an admin, I want to manage farm information, so that I can organize the system for multiple farm contexts.

#### Acceptance Criteria

1. WHEN an admin creates a farm, THE System SHALL associate it with an owner user
2. THE System SHALL track farm statistics including total livestock, barns, and sensors
3. WHEN viewing farm details, THE System SHALL display aggregated statistics and associated resources
