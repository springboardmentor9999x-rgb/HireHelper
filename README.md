# HireHelper

A comprehensive hiring and task management system built with a modern tech stack.

## Project Structure

```
hirehelper_project/
├── backend/          # Node.js Express API server
│   ├── src/
│   │   ├── config/   # Database and configuration
│   │   ├── controllers/  # Business logic
│   │   ├── models/   # Data models
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Email and other services
│   │   ├── middleware/   # Auth and error handling
│   │   └── utils/    # Helper utilities
│   ├── app.js
│   ├── server.js
│   └── package.json
│
└── frontend/         # Angular web application
    ├── src/
    │   ├── app/
    │   │   ├── components/   # UI components
    │   │   ├── services/     # HTTP and state services
    │   │   ├── pages/        # Page components
    │   │   └── app.routes.ts # Routing
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.css
    ├── angular.json
    └── package.json
```

## Features

- **Authentication**: User registration, login, and OTP verification
- **Task Management**: Create, update, and track tasks
- **Notifications**: Real-time notification system
- **Request Management**: Handle user requests and approvals
- **Settings**: User profile and preference management
- **Email Service**: Automated email notifications

## Tech Stack

**Backend:**
- Node.js
- Express.js
- Database (configured in src/config)

**Frontend:**
- Angular 17+
- TypeScript
- CSS3

## Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

## Installation

1. Clone the repository
2. Install dependencies in both backend and frontend directories
3. Configure environment variables
4. Run both servers

## API Endpoints

- **Authentication**: `/api/auth/*`
- **Tasks**: `/api/tasks/*`
- **Notifications**: `/api/notifications/*`
- **Requests**: `/api/requests/*`
- **Settings**: `/api/settings/*`
- **User Profile**: `/api/profile/*`

## Contributers

- Sailusha

## License

All rights reserved.
