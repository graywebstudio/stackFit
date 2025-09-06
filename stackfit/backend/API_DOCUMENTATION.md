# Gym Management System API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Responses
All endpoints may return these error responses:
```json
{
    "error": "Error message"
}
```
Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Admin Routes

### Login
```
POST /admin/login
```
Login as admin and get authentication token.

**Request Body:**
```json
{
    "email": "admin@example.com",
    "password": "your_password"
}
```

**Response:**
```json
{
    "token": "jwt_token_here",
    "admin": {
        "id": "uuid",
        "email": "admin@example.com",
        "name": "Admin Name"
    }
}
```

### Register New Admin
```
POST /admin/register
```
Register a new admin (requires existing admin authentication).

**Request Body:**
```json
{
    "email": "newadmin@example.com",
    "password": "password",
    "name": "New Admin"
}
```

**Response:**
```json
{
    "id": "uuid",
    "email": "newadmin@example.com",
    "name": "New Admin"
}
```

## Member Management

### Get All Members
```
GET /members
```
Get paginated list of members.

**Query Parameters:**
- page (default: 1)
- limit (default: 10)
- status (optional)
- search (optional)

**Response:**
```json
{
    "members": [{
        "id": "uuid",
        "name": "Member Name",
        "email": "member@example.com",
        "phone": "1234567890",
        "membership": {
            "name": "Gold Plan"
        }
    }],
    "totalPages": 5,
    "currentPage": 1,
    "totalMembers": 50
}
```

### Get Member Details
```
GET /members/:id
```
Get detailed information about a specific member.

**Response:**
```json
{
    "id": "uuid",
    "name": "Member Name",
    "email": "member@example.com",
    "phone": "1234567890",
    "address": "Address",
    "emergency_contact": {},
    "membership": {
        "name": "Gold Plan",
        "description": "Description",
        "duration": 12
    },
    "membershipStatus": "active",
    "attendancePercentage": 85,
    "payments": [],
    "attendance": []
}
```

### Add New Member
```
POST /members
```
Add a new member.

**Request Body:**
```json
{
    "name": "New Member",
    "email": "member@example.com",
    "phone": "1234567890",
    "membershipType": "uuid",
    "startDate": "2024-03-20",
    "endDate": "2024-04-20",
    "address": "Address",
    "emergencyContact": {
        "name": "Contact Name",
        "phone": "0987654321",
        "relationship": "Family"
    }
}
```

## Attendance Management

### Get Attendance Records
```
GET /attendance
```
Get attendance records with filters.

**Query Parameters:**
- startDate (optional)
- endDate (optional)
- memberId (optional)
- status (optional)

**Response:**
```json
[
    {
        "id": "uuid",
        "date": "2024-03-20",
        "status": "present",
        "member": {
            "id": "uuid",
            "name": "Member Name",
            "email": "member@example.com"
        }
    }
]
```

### Mark Attendance
```
POST /attendance
```
Mark attendance for a single member.

**Request Body:**
```json
{
    "memberId": "uuid",
    "date": "2024-03-20",
    "status": "present",
    "notes": "Optional notes"
}
```

### Bulk Mark Attendance
```
POST /attendance/bulk
```
Mark attendance for multiple members.

**Request Body:**
```json
{
    "date": "2024-03-20",
    "records": [
        {
            "memberId": "uuid",
            "status": "present",
            "notes": "Optional notes"
        }
    ]
}
```

## Payment Management

### Get Payments
```
GET /payments
```
Get payment records with filters.

**Query Parameters:**
- startDate (optional)
- endDate (optional)
- memberId (optional)
- status (optional)
- paymentType (optional)

**Response:**
```json
[
    {
        "id": "uuid",
        "amount": 1000,
        "payment_date": "2024-03-20",
        "payment_method": "card",
        "payment_type": "membership_fee",
        "status": "completed",
        "member": {
            "id": "uuid",
            "name": "Member Name"
        }
    }
]
```

### Record Payment
```
POST /payments
```
Record a new payment.

**Request Body:**
```json
{
    "memberId": "uuid",
    "amount": 1000,
    "paymentDate": "2024-03-20",
    "paymentMethod": "card",
    "paymentType": "membership_fee",
    "notes": "Optional notes"
}
```

### Get Due Payments
```
GET /payments/due
```
Get list of members with due payments.

**Response:**
```json
[
    {
        "memberId": "uuid",
        "name": "Member Name",
        "email": "member@example.com",
        "membershipType": "Gold Plan",
        "endDate": "2024-03-20",
        "daysOverdue": 5,
        "lastPayment": {
            "payment_date": "2024-02-20",
            "amount": 1000
        }
    }
]
```

### Get Payment Details
```
GET /payments/:id
```
Get detailed information about a specific payment including subscription period.

**Response:**
```json
{
    "id": "uuid",
    "amount": 1000,
    "payment_date": "2024-03-20",
    "payment_method": "card",
    "payment_type": "membership_fee",
    "status": "completed",
    "members": {
        "id": "uuid",
        "name": "Member Name",
        "email": "member@example.com"
    },
    "subscription_period": {
        "start_date": "2024-03-20",
        "end_date": "2024-04-20",
        "total_days": 31,
        "elapsed_days": 15,
        "days_remaining": 16,
        "progress": 48.4,
        "is_active": true
    },
    "payment_history": [
        {
            "id": "uuid",
            "amount": 1000,
            "payment_date": "2024-03-20",
            "payment_method": "card",
            "payment_type": "membership_fee",
            "status": "completed"
        }
    ]
}
```

### Send Due Date Notifications
```
POST /payments/send-due-notifications
```
Send email notifications to members with overdue payments and upcoming renewals.

**Response:**
```json
{
    "success": true,
    "results": {
        "overdue": {
            "total": 5,
            "sent": 4,
            "failed": 1,
            "members": [
                {
                    "id": "uuid",
                    "name": "Member Name",
                    "email": "member@example.com",
                    "daysOverdue": 5
                }
            ]
        },
        "upcoming": {
            "total": 3,
            "sent": 3,
            "failed": 0,
            "members": [
                {
                    "id": "uuid",
                    "name": "Member Name",
                    "email": "member@example.com",
                    "daysUntilRenewal": 3
                }
            ]
        }
    }
}
```

## Membership Types

### Get All Membership Types
```
GET /memberships
```
Get all membership types/plans.

**Query Parameters:**
- status (optional)

**Response:**
```json
[
    {
        "id": "uuid",
        "name": "Gold Plan",
        "description": "Description",
        "duration": 12,
        "price": 1000,
        "features": ["Feature 1", "Feature 2"],
        "status": "active"
    }
]
```

### Create Membership Type
```
POST /memberships
```
Create a new membership type.

**Request Body:**
```json
{
    "name": "New Plan",
    "description": "Description",
    "duration": 12,
    "price": 1000,
    "features": ["Feature 1", "Feature 2"],
    "status": "active"
}
```

## Statistics and Reports

### Attendance Statistics
```
GET /attendance/stats
```
Get attendance statistics.

**Query Parameters:**
- startDate (optional)
- endDate (optional)
- memberId (optional)

**Response:**
```json
{
    "total": 100,
    "present": 85,
    "absent": 10,
    "late": 5,
    "memberWise": {
        "member_id": {
            "name": "Member Name",
            "total": 30,
            "present": 25,
            "absent": 3,
            "late": 2
        }
    }
}
```

### Payment Statistics
```
GET /payments/stats
```
Get payment statistics.

**Query Parameters:**
- startDate (optional)
- endDate (optional)

**Response:**
```json
{
    "totalAmount": 50000,
    "byPaymentType": {
        "membership_fee": 45000,
        "registration_fee": 5000
    },
    "byPaymentMethod": {
        "card": 30000,
        "cash": 20000
    }
}
```

### Membership Statistics
```
GET /memberships/stats/overview
```
Get membership type statistics.

**Response:**
```json
[
    {
        "id": "uuid",
        "name": "Gold Plan",
        "totalMembers": 50,
        "activeMembers": 45
    }
]
```

## Notes
1. All protected routes require authentication token
2. Admin routes require admin role
3. Dates should be in ISO 8601 format (YYYY-MM-DD)
4. All IDs are UUIDs
5. Pagination is available for list endpoints
6. Search and filters are case-insensitive 