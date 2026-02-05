# Design Document

## Overview

VishwaGuru is an AI-powered civic engagement platform that enables Indian citizens to identify, report, and take action on infrastructure issues, particularly potholes. The system integrates computer vision (YOLOv8), natural language processing (Gemini AI), and government data to bridge the gap between citizens and local authorities.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services   │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (YOLOv8 +     │
│                 │    │                 │    │    Gemini)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Database      │    │   Model Files   │
│   (User Interface)   │   (SQLite/      │    │   (YOLOv8 +     │
│                 │    │   PostgreSQL)   │    │   Gemini API)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Responsive design for mobile and desktop

**Backend:**
- FastAPI (Python) for REST API
- SQLAlchemy for database ORM
- Pydantic for data validation
- CORS middleware for cross-origin requests

**AI Services:**
- YOLOv8 for pothole detection
- Google Gemini AI for natural language processing
- PIL/OpenCV for image processing

**Database:**
- SQLite for development
- PostgreSQL for production
- JSON files for government data (MLA information)

**Deployment:**
- Frontend: Netlify
- Backend: Render
- Environment-based configuration

## Data Models

### Issue Model
```python
class Issue:
    id: int (Primary Key)
    description: str
    category: str
    email: str (Optional)
    image_path: str (Optional)
    created_at: datetime
    status: str (Default: "reported")
```

### Detection Result Model
```python
class DetectionResult:
    detections: List[Detection]
    image_processed: bool
    processing_time: float

class Detection:
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float
    class_name: str
```

### MLA Information Model
```python
class MLAInfo:
    name: str
    party: str
    constituency: str
    district: str
    contact_details: Dict
    role_description: str
```

## API Design

### Core Endpoints

#### 1. Pothole Detection
```
POST /detect-pothole
Content-Type: multipart/form-data

Request:
- image: File (JPEG, PNG, WebP)

Response:
{
  "detections": [
    {
      "bbox": [x1, y1, x2, y2],
      "confidence": 0.85,
      "class": "pothole"
    }
  ],
  "message": "Detection completed",
  "processing_time": 2.3
}
```

#### 2. Issue Reporting
```
POST /report-issue
Content-Type: application/json

Request:
{
  "description": "Large pothole on Main Street",
  "category": "road",
  "email": "citizen@example.com",
  "image_path": "/uploads/image123.jpg"
}

Response:
{
  "issue_id": 123,
  "action_plan": {
    "whatsapp_message": "...",
    "email_template": "...",
    "whatsapp_link": "https://wa.me/...",
    "social_media_post": "..."
  }
}
```

#### 3. MLA Lookup
```
GET /mla-info/{pincode}

Response:
{
  "mla": {
    "name": "John Doe",
    "party": "ABC Party",
    "constituency": "Mumbai North",
    "district": "Mumbai",
    "contact_details": {...},
    "role_description": "..."
  },
  "grievance_portals": [
    {
      "name": "CPGRAMS",
      "url": "https://pgportal.gov.in/"
    }
  ]
}
```

#### 4. Chat Assistant
```
POST /chat
Content-Type: application/json

Request:
{
  "message": "How do I report a water supply issue?"
}

Response:
{
  "response": "To report a water supply issue...",
  "suggestions": ["Check MLA info", "Report issue"]
}
```

#### 5. Community Activity
```
GET /recent-issues?limit=10

Response:
{
  "issues": [
    {
      "id": 123,
      "category": "road",
      "description": "Large pothole...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## User Interface Design

### Main Components

#### 1. Home Page
- Hero section with platform introduction
- Quick action buttons (Report Issue, Detect Pothole, Find MLA)
- Recent community activity feed
- Chat widget for AI assistance

#### 2. Pothole Detection Interface
- Image upload area with drag-and-drop
- Real-time detection results with bounding boxes
- Confidence scores and detection statistics
- Option to report detected issues

#### 3. Issue Reporting Form
- Category selection (road, water, garbage, etc.)
- Description text area
- Optional email field
- Image upload (optional)
- Generated action plan display

#### 4. MLA Lookup Interface
- Pincode input field with validation
- MLA information display card
- Government portal links
- AI-generated role descriptions

#### 5. Chat Interface
- Conversational AI assistant
- Context-aware responses
- Quick action suggestions
- Fallback handling for service unavailability

## AI Integration

### YOLOv8 Pothole Detection

**Model Configuration:**
- Pre-trained YOLOv8n model
- Custom training on pothole datasets
- Confidence threshold: 0.7
- Input image size: 640x640
- Output: Bounding boxes, confidence scores, class labels

**Processing Pipeline:**
1. Image validation and preprocessing
2. Model inference with YOLOv8
3. Post-processing and filtering
4. Result formatting and response

### Gemini AI Integration

**Use Cases:**
- Generate action plan templates
- Provide civic guidance through chat
- Create contextual communication messages
- Generate MLA role descriptions

**API Configuration:**
- Model: gemini-pro
- Temperature: 0.7
- Max tokens: 1000
- Safety settings: Block harmful content

## Security and Privacy

### Data Protection
- Secure image storage with unique identifiers
- Personal information anonymization in public feeds
- Input validation and sanitization
- Rate limiting on API endpoints

### Authentication and Authorization
- No user authentication required for MVP
- API rate limiting by IP address
- CORS configuration for allowed origins
- Input validation for all endpoints

### Error Handling
- Graceful degradation when AI services unavailable
- Comprehensive error logging without exposing sensitive data
- User-friendly error messages
- Fallback responses for service failures

## Performance Considerations

### Optimization Strategies
- Image compression before processing
- Async processing for AI operations
- Database indexing on frequently queried fields
- Caching for government data lookups

### Scalability
- Stateless API design
- Horizontal scaling capability
- Database connection pooling
- CDN for static assets

### Monitoring
- Health check endpoints
- Performance metrics logging
- Error rate monitoring
- Resource usage tracking

## Deployment Architecture

### Development Environment
- Local SQLite database
- Environment variables for API keys
- Hot reload for development
- Mock data for testing

### Production Environment
- PostgreSQL database on Render
- Environment-based configuration
- SSL/HTTPS enforcement
- Production logging and monitoring

### CI/CD Pipeline
- Automated testing on pull requests
- Separate staging and production deployments
- Environment variable management
- Database migration handling

## Testing Strategy

### Unit Testing
- API endpoint testing
- AI model integration testing
- Database operation testing
- Utility function testing

### Integration Testing
- End-to-end user workflows
- AI service integration
- Database connectivity
- External API integration

### Performance Testing
- Load testing for concurrent users
- AI model inference benchmarking
- Database query optimization
- Memory usage profiling

## Future Enhancements

### Phase 2 Features
- User authentication and profiles
- Issue status tracking and updates
- Push notifications
- Mobile app development

### Advanced AI Features
- Multi-language support
- Advanced image analysis
- Predictive analytics for infrastructure issues
- Automated authority contact

### Government Integration
- Real-time government API integration
- Official grievance portal integration
- Status updates from authorities
- Automated follow-up systems

## Correctness Properties

### Property 1: Image Processing Reliability
**Validates: Requirements 1.1, 1.2, 1.5**

For all valid image inputs, the pothole detection system must either:
- Return valid detection results with proper bounding boxes and confidence scores, OR
- Return an empty detection array with appropriate messaging, OR  
- Return a descriptive error message while maintaining system stability

The system must never crash, return malformed data, or leave the user in an undefined state.

### Property 2: Issue Storage Integrity
**Validates: Requirements 2.1, 2.5**

For all issue reports submitted with valid data, the system must:
- Store the issue with a unique identifier and accurate timestamp
- Preserve all provided information (description, category, email, image reference)
- Maintain referential integrity between issues and any associated images
- Ensure stored data can be retrieved accurately for community activity display

### Property 3: MLA Lookup Consistency
**Validates: Requirements 3.1, 3.2, 3.5**

For all pincode inputs, the system must:
- Validate 6-digit format and return appropriate errors for invalid input
- For valid Maharashtra pincodes in the database: return complete MLA information
- For valid pincodes not in database: return helpful error messages with alternatives
- Never return partial or inconsistent data that could mislead citizens

### Property 4: AI Service Graceful Degradation
**Validates: Requirements 4.4, 9.3**

When AI services (Gemini, YOLOv8) are unavailable or fail, the system must:
- Provide meaningful fallback responses that maintain user experience
- Continue to function for non-AI dependent features
- Return appropriate error messages without exposing internal system details
- Allow users to retry operations when services recover

### Property 5: Response Time Compliance
**Validates: Requirements 1.2, 2.2, 4.1**

For all user-initiated operations, the system must:
- Complete pothole detection within 10 seconds for valid images
- Generate action plans within 15 seconds of issue submission  
- Respond to chat messages within 10 seconds
- Provide loading indicators and timeout handling for longer operations

### Property 6: Data Privacy Protection
**Validates: Requirements 5.2, 5.4, 7.3**

For all community activity displays and data storage, the system must:
- Exclude personally identifiable information (email addresses, personal details)
- Show only category, truncated description, and timestamp for public feeds
- Anonymize or aggregate data to prevent user identification
- Maintain privacy even when displaying recent community activity

### Property 7: Input Validation and Security
**Validates: Requirements 1.1, 3.1, 7.4**

For all user inputs across the system, the system must:
- Validate image formats (JPEG, PNG, WebP) and reject unsupported formats
- Validate pincode format (6 digits) and provide clear error messages
- Implement rate limiting to prevent abuse of API endpoints
- Sanitize all text inputs to prevent injection attacks

### Property 8: Government Data Accuracy
**Validates: Requirements 8.1, 8.3, 8.5**

For all government data operations, the system must:
- Return MLA information from verified sources or clearly mark as sample data
- Include appropriate disclaimers about data accuracy for MVP implementations
- Provide clear error messages when data integrity issues are detected
- Maintain consistency between pincode mappings and representative information
