# HireHelper - Backend API

A modern Express.js backend for the HireHelper recruitment management system with PostgreSQL database and JWT authentication.

## Project Structure

```
hirehelper_project/
├── src/
│   ├── config/          # Configuration files (database, constants)
│   ├── controllers/      # Business logic controllers
│   ├── routes/          # API route definitions
│   ├── middleware/       # Custom middleware (auth, error handling)
│   └── models/          # Database models and queries
├── app.js              # Express app entry point
├── package.json        # Dependencies
├── .env                # Environment variables
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Update `.env` file with your database credentials
   - Set JWT_SECRET to a secure random string
   - Configure Database connection details

3. **Initialize Database:**
   ```bash
   # Create your database and tables
   createdb hirehelper
   # Run migrations (create as needed)
   ```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Users Routes
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Jobs Routes
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (recruiter only)
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)

### Applications Routes
- `GET /api/applications` - Get applications
- `POST /api/applications` - Submit application
- `PUT /api/applications/:id` - Update application status

## Authentication

This API uses JWT (JSON Web Token) for authentication:

1. User logs in with credentials
2. Server returns JWT token
3. Client includes token in Authorization header: `Authorization: Bearer <token>`
4. Token expires after 7 days (configurable in .env)

## Development Notes

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Import route in `src/routes/index.js`

Example:
```javascript
// src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, userController.getAll);
router.get('/:id', verifyToken, userController.getById);

module.exports = router;

// In src/routes/index.js
router.use('/api/users', require('./userRoutes'));
```

### Database Connection

Database pool is configured in `src/config/database.js` with error handling and logging.

## Environment Variables

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hirehelper
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
API_URL=http://localhost:5000
```

## Security Considerations

- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Implement rate limiting
- Validate and sanitize all inputs
- Use parameterized queries (already implemented with pg library)
- Set secure CORS headers
- Hash passwords with bcrypt

## Troubleshooting

**Database connection error:**
- Check PostgreSQL is running
- Verify credentials in .env
- Ensure database exists

**Port already in use:**
- Change PORT in .env
- Or kill process: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

**JWT token errors:**
- Verify token format: `Bearer <token>`
- Check JWT_SECRET matches
- Verify token hasn't expired

## Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload

## License

ISC

## Author

[Your Name/Organization]
