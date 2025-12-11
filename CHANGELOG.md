# Changelog

All notable changes to the AI Butler Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-12-11

### Added

- **Direct Chat Feature** - Free-form conversation with Simi
  - `POST /api/chat/message` - Send a message and get AI response
  - `GET /api/chat/history` - Retrieve chat history
  - `DELETE /api/chat/history` - Clear chat history
  - New `ChatLog` model for storing conversation history
  - Context-aware responses (Simi knows your mood and pending tasks)
  - Conversation memory (last 6 messages maintained for flow)

### Changed

- **AI Persona Update** - Renamed Butler to "Simi" with enhanced personality
- **Chat system instruction** - Simi adjusts tone based on user's energy level

---

## [1.1.0] - 2025-12-11

### Added

- **Mood Logging Endpoint** - `POST /api/butler/log-mood`
  - Log mood without triggering AI consultation
  - Accepts `mood`, `energy_level`, and optional `raw_input`
  - Returns log ID for reference

### Changed

- **Consult Endpoint Refactored** - `POST /api/butler/consult`
  - No longer requires mood/energy in request body
  - Automatically fetches last 3 mood logs for context
  - Accepts optional `user_message` for additional context
  - Returns structured JSON response instead of free-form text

- **AI Response Format** - New structured output:
  ```json
  {
    "empathy_statement": "Brief validation of user's state",
    "chosen_task_id": "task_id or null",
    "reasoning": "Why this task was selected",
    "micro_step": "First tiny action to start"
  }
  ```

- **System Prompt Upgrade** - Enhanced "Executive Function Butler" logic:
  - Energy < 3: Suggests quick wins or rest, ignores high-friction tasks
  - Anxious/Overwhelmed mood: Extra gentle, validates feelings first
  - Energy > 7: Gently pushes toward important tasks

### Removed

- Removed `current_mood` and `current_energy` as required fields in `/consult`
- Removed `context_log_id` from consult response (mood logging is now separate)

---

## [1.0.1] - 2025-12-11

### Added

- **Deployment Configuration**
  - `Dockerfile` - Multi-stage production build
  - `docker-compose.yml` - Full stack with MongoDB
  - `.dockerignore` - Optimized Docker builds
  - `ecosystem.config.js` - PM2 process management
  - `.env.example` - Environment variable template
  - `DEPLOYMENT.md` - Comprehensive VPS deployment guide

### Changed

- **AI Model** - Updated to `gemini-2.5-flash` for better availability
- **Error Handling** - Improved AI service error messages with specific status codes
- **Startup Logging** - Added Gemini API key status indicator

### Fixed

- Docker healthcheck now uses `curl` instead of `wget` (Alpine compatibility)
- Added API key validation at startup with warning message

---

## [1.0.0] - 2025-12-10

### Added

- **Authentication System**
  - User registration with username, email, password
  - JWT-based login with configurable expiration
  - Profile retrieval endpoint
  - Password hashing with SHA-256

- **Task Management**
  - Create, read, update, delete tasks
  - Task properties: title, energy_cost, emotional_friction, associated_value, due_date
  - Mark tasks as complete
  - Filter completed/incomplete tasks

- **Butler Consultation**
  - AI-powered task recommendations
  - Energy and mood-aware suggestions
  - Consultation history tracking
  - User profile with core values and baseline energy

- **Core Infrastructure**
  - Express.js with TypeScript
  - MongoDB with Mongoose ODM
  - Google Gemini AI integration
  - Request logging with Morgan
  - CORS support
  - Health check endpoint

---

## Version History Summary

| Version | Date | Highlights |
| ------- | ---- | ---------- |
| 1.2.0 | 2025-12-11 | Direct chat with Simi |
| 1.1.0 | 2025-12-11 | Mood logging, structured AI responses |
| 1.0.1 | 2025-12-11 | Docker deployment, error handling |
| 1.0.0 | 2025-12-10 | Initial release |

