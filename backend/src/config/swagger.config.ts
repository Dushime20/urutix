import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const port = process.env.PORT || 3000;
  const config = new DocumentBuilder()
    .setTitle('UrutiX Enhanced Cargo Management API')
    .setDescription(
      `
      # UrutiX Enhanced Cargo Management API

      ## Overview
      UrutiX is a comprehensive cargo management platform that connects cargo owners with truck owners and drivers. 
      This API provides all the necessary endpoints for managing cargo operations with enhanced cargo recording capabilities
      for optimal truck-cargo matching.

      ## Enhanced Cargo Features
      - **Comprehensive Cargo Recording**: 40+ enhanced fields for detailed cargo specifications
      - **Dimensional Specifications**: Length, width, height, stackable height, packaging details
      - **Environmental Requirements**: Temperature control, humidity control, hazmat classification
      - **Loading & Unloading**: Equipment requirements, time estimates, special instructions
      - **Security & Insurance**: GPS monitoring, temperature monitoring, insurance requirements
      - **Route & Access**: Clearance requirements, escort vehicles, route planning
      - **Urgency & Timing**: Urgency levels, time-critical flags, transit time limits
      - **Advanced Matching**: Truck requirements, carrier preferences, cost preferences
      - **Quality & Inspection**: Pre-shipment inspection, delivery inspection, photo documentation

      ## Enhanced Matching System

      ### Multiple Matching Algorithms
      The system provides 5 different matching algorithms for various scenarios:

      #### 1. Weighted Scoring (Default)
      - **Purpose**: Standard matching with configurable weights
      - **Best for**: General cargo matching with balanced criteria
      - **Features**: Dynamic weight adjustment, comprehensive scoring, real-time filtering

      #### 2. Hungarian Algorithm
      - **Purpose**: Optimal assignment for multiple loads and trucks
      - **Best for**: Fleet optimization and batch assignments
      - **Features**: Minimizes total cost, handles unbalanced scenarios, efficiency metrics

      #### 3. Genetic Algorithm
      - **Purpose**: Evolutionary optimization for complex scenarios
      - **Best for**: Large-scale matching with multiple constraints
      - **Features**: Population-based optimization, configurable parameters, convergence detection

      #### 4. TOPSIS Algorithm
      - **Purpose**: Multi-criteria decision making
      - **Best for**: Complex scenarios with conflicting criteria
      - **Features**: Ideal and negative-ideal solution analysis, normalized decision matrix

      #### 5. Hybrid Algorithm
      - **Purpose**: Combines multiple algorithms for optimal results
      - **Best for**: High-accuracy matching requirements
      - **Features**: Ensemble approach, deduplication, re-scoring methodology

      ### Enhanced Scoring Factors
      The system evaluates matches across 12 comprehensive scoring factors:

      #### Core Compatibility Scores
      - **Distance Score**: Proximity-based scoring with configurable thresholds
      - **Capacity Score**: Weight and volume utilization optimization
      - **Equipment Score**: Specialized equipment compatibility
      - **Temperature Score**: Refrigeration and temperature control matching
      - **Security Score**: GPS tracking, monitoring, and insurance requirements
      - **Route Score**: Clearance, escort, and route-specific requirements
      - **Time Score**: Urgency and availability-based scoring

      #### Advanced Scoring Factors
      - **Experience Score**: Driver and truck experience with cargo types
      - **Availability Score**: Real-time availability and estimated availability time
      - **Special Requirements Score**: Fragile, hazardous, and specialized handling
      - **Rating Score**: Historical performance and reliability metrics
      - **Cost Score**: Market-competitive pricing analysis

      ### Dynamic Weighting System
      The system automatically adjusts scoring weights based on cargo characteristics:

      #### Cargo Type Adjustments
      - **Hazardous Cargo**: Increases equipment and security weights
      - **Time-Critical Cargo**: Prioritizes availability and distance
      - **Fragile Cargo**: Emphasizes equipment and experience
      - **Refrigerated Cargo**: Focuses on temperature control and equipment
      - **High-Value Cargo**: Prioritizes security and experience

      #### Urgency Level Adjustments
      - **CRITICAL**: Maximum time and distance priority
      - **HIGH**: Increased time and availability weights
      - **NORMAL**: Balanced weighting
      - **LOW**: Cost and efficiency focus

      ### Comprehensive Result Data
      Each match result includes detailed information:

      #### Core Scoring
      - Overall compatibility score (0-1 scale)
      - Individual factor scores
      - Distance and cost analysis
      - Profit margin calculations

      #### Risk and Probability
      - Success probability prediction
      - Risk score assessment
      - Confidence level calculation
      - Market context analysis

      #### Timing and Delivery
      - Estimated delivery time
      - Estimated pickup time
      - Total transit time
      - Route optimization data

      #### Cost Breakdown
      - Fuel cost estimation
      - Labor cost calculation
      - Maintenance cost analysis
      - Insurance and tolls

      #### Environmental Impact
      - CO2 emissions calculation
      - Fuel consumption analysis
      - Eco score assessment

      #### Performance Metrics
      - Processing time
      - Algorithm used
      - Data quality assessment
      - Historical performance

      ## Enhanced Cargo Fields

      ### Dimensional Specifications
      - **length, width, height**: Cargo dimensions in meters
      - **stackableHeight**: Maximum stackable height
      - **isStackable**: Whether cargo can be stacked
      - **packagingType**: Type of packaging (pallets, crates, boxes, etc.)
      - **numberOfPieces**: Number of individual pieces
      - **numberOfPallets**: Number of pallets

      ### Environmental Requirements
      - **temperatureMin, temperatureMax**: Temperature range in Celsius
      - **requiresHumidityControl**: Humidity control requirement
      - **hazmatClass**: UN hazmat classification
      - **hazmatNumber**: UN hazmat number

      ### Loading & Unloading
      - **requiresForklift**: Forklift requirement for loading/unloading
      - **requiresCrane**: Crane requirement for loading/unloading
      - **requiresLoadingDock**: Loading dock requirement
      - **loadingTimeEstimate**: Estimated loading time in hours
      - **unloadingTimeEstimate**: Estimated unloading time in hours
      - **loadingInstructions**: Specific loading instructions
      - **unloadingInstructions**: Specific unloading instructions

      ### Security & Insurance
      - **requiresGpsMonitoring**: GPS monitoring during transit
      - **requiresTemperatureMonitoring**: Temperature monitoring during transit
      - **insuranceValue**: Insurance value of cargo
      - **emergencyContactInfo**: Emergency contact information

      ### Route & Access
      - **requiresLowClearanceRoute**: Low clearance route planning
      - **maxClearanceHeight**: Maximum clearance height in meters
      - **requiresEscortVehicle**: Escort vehicle requirement

      ### Urgency & Timing
      - **urgencyLevel**: LOW, NORMAL, HIGH, CRITICAL
      - **isTimeCritical**: Time critical cargo flag
      - **maxTransitTime**: Maximum transit time in hours

      ### Advanced Matching Criteria
      - **truckRequirements**: Specific truck requirements (capacity, features, age, etc.)
      - **carrierPreferences**: Carrier preferences (rating, distance, availability)
      - **costPreferences**: Cost and payment preferences (budget, terms, insurance)

      ### Quality & Inspection
      - **requiresPreShipmentInspection**: Pre-shipment inspection requirement
      - **requiresDeliveryInspection**: Delivery inspection requirement
      - **requiresPhotographicDocumentation**: Photo documentation requirement
      - **specialHandlingInstructions**: Special handling instructions

      ## Enhanced Truck Capabilities

      ### Cargo-Specific Specifications
      - **truckType**: Type of truck (flatbed, box truck, tanker, etc.)
      - **trailerType**: Type of trailer (dry van, refrigerated, etc.)

      ### Essential Cargo Equipment
      - **hasSideRails, hasTarps, hasStraps, hasChains**: Basic securing equipment
      - **hasWinch, hasRam, hasTailLift, hasSideLift**: Loading/unloading equipment
      - **hasRollerBed, hasDropDeck, hasExtendable**: Specialized platforms
      - **hasLowbed, hasStepDeck, hasPowerOnly**: Specialized configurations
      - **hasContainerChassis**: Container handling capability

      ### Cargo Type Capabilities
      - **hasTanker, hasBulk, hasRefrigerated**: Cargo type specialization
      - **hasHeated, hasVentilated, hasCurtainSide**: Environmental control
      - **hasBox, hasVan, hasPlatform, hasCarCarrier**: Transport type
      - **hasHeavyHaul, hasOversized**: Specialized transport

      ### Specialized Cargo Capabilities
      - **hasHazmat, hasDangerousGoods**: Hazardous material handling
      - **hasFoodGrade, hasPharmaceutical**: Food and pharmaceutical transport
      - **hasLiquid, hasDryBulk, hasGas, hasChemical**: Material type handling
      - **hasWaste**: Waste transport capability

      ### Temperature Control
      - **hasReefer, hasFrozen, hasChilled, hasAmbient**: Temperature ranges
      - **hasControlledAtmosphere, hasHumidityControl**: Environmental control
      - **hasTemperatureMonitoring**: Real-time monitoring

      ### Technology and Tracking
      - **hasGPS, hasTracking, hasTelematics**: Location and tracking
      - **hasELD, hasDashCam, hasSafetyCameras**: Safety and compliance
      - **hasCollisionAvoidance, hasLaneDeparture**: Advanced safety features
      - **hasAdaptiveCruise, hasBlindSpot, hasBackupCamera**: Driver assistance

      ### Monitoring Systems
      - **hasTirePressureMonitoring, hasEngineMonitoring**: Vehicle monitoring
      - **hasFuelMonitoring, hasMaintenanceAlerts**: Performance monitoring
      - **hasDriverMonitoring, hasFatigueMonitoring**: Driver monitoring
      - **hasSpeedMonitoring, hasIdleMonitoring**: Behavior monitoring

      ### Cargo Monitoring
      - **hasTemperatureAlerts, hasHumidityAlerts**: Environmental monitoring
      - **hasShockMonitoring, hasTiltMonitoring**: Cargo condition monitoring
      - **hasDoorMonitoring, hasCargoMonitoring**: Security monitoring
      - **hasWeightMonitoring, hasVolumeMonitoring**: Capacity monitoring

      ### Safety Systems
      - **hasLeakDetection, hasOverfillProtection**: Safety features
      - **hasEmergencyShutdown, hasFireSuppression**: Emergency systems
      - **hasExplosionProof**: Hazardous material safety

      ## API Endpoints

      ### Enhanced Matching Endpoints
      - **POST /matching/find-matches**: Main matching endpoint with algorithm selection
      - **POST /matching/find-matches/hungarian**: Hungarian algorithm matching
      - **POST /matching/find-matches/genetic**: Genetic algorithm matching
      - **POST /matching/find-matches/topsis**: TOPSIS algorithm matching
      - **POST /matching/find-matches/hybrid**: Hybrid algorithm matching

      ### Analytics Endpoints
      - **GET /matching/market-insights**: Market analytics and insights
      - **GET /matching/comprehensive-metrics**: Comprehensive performance metrics
      - **GET /matching/algorithms**: Available algorithms information
      - **GET /matching/scoring-factors**: Scoring factors and weights

      ### Utility Endpoints
      - **POST /matching/clear-caches**: Clear all matching caches

      ## Authentication
      Most endpoints require authentication. Include the JWT token in the Authorization header:
      \`\`\`
      Authorization: Bearer <your-jwt-token>
      \`\`\`

      ## Rate Limiting
      API requests are rate-limited to ensure fair usage. Please respect the limits.

      ## Error Handling
      The API returns standard HTTP status codes and detailed error messages in JSON format.

      ## Enhanced Matching Algorithm
      The system uses a multi-dimensional scoring algorithm that considers:
      - Distance compatibility (15%)
      - Capacity utilization (20%)
      - Equipment matching (25%)
      - Temperature control (10%)
      - Security requirements (10%)
      - Route compatibility (5%)
      - Time compatibility (5%)
      - Experience (2%)
      - Availability (2%)
      - Special requirements (1%)
      - Rating (3%)
      - Cost efficiency (2%)

      ## Support
      For API support, please contact our development team.
    `,
    )
    .setVersion('3.0.0')
    .setContact('UrutiX Team', 'https://urutix.com', 'support@urutix.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag(
      'Enhanced Loads',
      'Enhanced cargo load management with comprehensive field support',
    )
    .addTag(
      'Enhanced Matching',
      'Advanced cargo-truck matching with multiple algorithms and comprehensive scoring',
    )
    .addTag('Trips', 'Trip management and tracking endpoints')
    .addTag('Fleet', 'Truck and driver management endpoints')
    .addTag('Payments', 'Payment processing and transaction endpoints')
    .addTag('Analytics', 'Business intelligence and reporting endpoints')
    .addTag('Notifications', 'User notification management endpoints')
    .addTag('Locations', 'Geospatial and location services endpoints')
    .addServer(`http://localhost:${port}`, 'Development server')
    .addServer('https://api.urutix.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      showExtensions: true,
      displayRequestDuration: true,
      displayOperationId: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .info .description { font-size: 14px; }
      .swagger-ui .scheme-container { background: #f8fafc; }
      .swagger-ui .opblock-tag-section { margin-bottom: 20px; }
      .swagger-ui .opblock-tag { font-size: 16px; font-weight: 600; }
      .swagger-ui .opblock-summary-description { color: #6b7280; }
      .swagger-ui .parameter__name { font-weight: 600; }
      .swagger-ui .parameter__type { color: #6b7280; }
      .swagger-ui .parameter__deprecated { color: #ef4444; }
      .swagger-ui .model-box { background: #f8fafc; border-radius: 8px; }
      .swagger-ui .model-title { color: #1f2937; }
      .swagger-ui .model { font-size: 13px; }
      .swagger-ui .opblock.opblock-post { border-color: #10b981; }
      .swagger-ui .opblock.opblock-get { border-color: #3b82f6; }
      .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
      .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
      .swagger-ui .opblock-summary-method { font-weight: 600; }
      .swagger-ui .opblock-summary-path { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
      .swagger-ui .response-col_status { font-weight: 600; }
      .swagger-ui .response-col_description { color: #6b7280; }
      .swagger-ui .responses-table { background: #f8fafc; }
      .swagger-ui .responses-inner { padding: 16px; }
      .swagger-ui .highlight-code { background: #f1f5f9; }
      .swagger-ui .microlight { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
      .swagger-ui .body-param__text { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
      .swagger-ui .body-param__example { background: #f1f5f9; padding: 8px; border-radius: 4px; }
      .swagger-ui .body-param__example pre { margin: 0; }
      .swagger-ui .body-param__example code { background: none; padding: 0; }
      .swagger-ui .body-param__example .highlight-code { background: none; }
      .swagger-ui .body-param__example .microlight { background: none; }
    `,
    customSiteTitle: 'UrutiX Enhanced Cargo API Documentation',
  });

  return document;
}
