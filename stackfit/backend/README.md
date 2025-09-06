# Gym Management System Backend

A comprehensive backend system for managing gym operations including member management, attendance tracking, payment processing, and subscription management.

## Features

- **Admin Management**
  - Secure authentication with JWT
  - Admin registration and profile management
  - Role-based access control

- **Member Management**
  - Member registration and profile management
  - Membership status tracking
  - Emergency contact information
  - Detailed member history

- **Attendance System**
  - Daily attendance tracking
  - Bulk attendance marking
  - Attendance reports and statistics
  - Present/Absent/Late status tracking

- **Payment Management**
  - Multiple payment methods support
  - Payment history tracking
  - Due payment monitoring
  - Subscription renewal tracking
  - Payment reports and statistics

- **Membership Plans**
  - Flexible membership types
  - Custom duration and pricing
  - Feature-based plans
  - Usage statistics

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- PostgreSQL (provided by Supabase)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3001
   JWT_SECRET=your_jwt_secret_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   NODE_ENV=development
   ```

4. **Database Setup**
   - Create a new project in Supabase
   - Go to SQL editor in Supabase dashboard
   - Copy the contents of `database/schema.sql`
   - Execute the SQL to create all necessary tables and triggers

5. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

Detailed API documentation is available in `API_DOCUMENTATION.md`. The API base URL is:
```
http://localhost:3001/api
```

## Project Structure

```
backend/
├── config/
│   └── supabaseClient.js
├── database/
│   └── schema.sql
├── middleware/
│   ├── authMiddleware.js
│   └── errorHandler.js
├── routes/
│   ├── admin.js
│   ├── attendance.js
│   ├── members.js
│   ├── membership.js
│   └── payments.js
├── .env
├── index.js
├── package.json
└── README.md
```

## Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Password hashing with bcrypt
   - Token expiration

2. **Data Protection**
   - Input validation
   - SQL injection protection
   - Rate limiting
   - Error handling

3. **Best Practices**
   - Environment variables
   - Secure password storage
   - Request validation
   - Proper error responses

## Error Handling

The system includes comprehensive error handling:
- Validation errors
- Authentication errors
- Database errors
- Custom error messages
- Proper HTTP status codes

## Database Schema

The system uses the following main tables:
- `admins`: Admin user management
- `members`: Member information
- `memberships`: Membership plans/types
- `attendance`: Attendance records
- `payments`: Payment transactions

Refer to `database/schema.sql` for complete schema details.

## Development

1. **Running Tests**
   ```bash
   npm test
   ```

2. **Code Linting**
   ```bash
   npm run lint
   ```

3. **Database Migrations**
   - Use Supabase dashboard for schema changes
   - Keep `schema.sql` updated
   - Document all changes

## Production Deployment

1. **Environment Setup**
   - Set NODE_ENV=production
   - Use strong JWT_SECRET
   - Configure proper CORS settings

2. **Security Checklist**
   - Enable SSL/TLS
   - Set up proper firewalls
   - Configure rate limiting
   - Regular security audits

3. **Monitoring**
   - Set up error logging
   - Monitor API performance
   - Track system resources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support and queries:
1. Check the API documentation
2. Review the README
3. Create an issue in the repository

## License

This project is licensed under the MIT License - see the LICENSE file for details. 