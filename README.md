# SkillBridge - MERN Stack Application

Bridge Your Skills to the Future

## Project Overview

SkillBridge is a comprehensive learning platform built with the MERN stack (MongoDB, Express, React, Node.js). It provides a robust authentication system and dashboard for users and admins to manage their learning journeys.

## Features

### Authentication
- ✅ User Registration (User & Admin roles)
- ✅ User Login with JWT
- ✅ Password encryption with bcryptjs
- ✅ Protected Routes
- ✅ Role-based access control

### Dashboard
- 📊 Overview with statistics
- 📚 Course management
- 📈 Progress tracking
- 🎓 Certificate management
- ⚙️ User settings
- 🚀 Recent activity feed

## Project Structure

```
SkillBridge/
├── backend/                 # Node.js + Express backend
│   ├── models/             # MongoDB schemas
│   │   └── User.js
│   ├── controllers/        # Business logic
│   │   └── authController.js
│   ├── routes/             # API routes
│   │   └── auth.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── server.js           # Express server entry point
│   ├── package.json
│   └── .env.example        # Environment variables template
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── pages/          # Page components
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Dashboard.jsx
    │   ├── styles/         # CSS files
    │   │   ├── App.css
    │   │   ├── Auth.css
    │   │   └── Dashboard.css
    │   ├── utils/          # Utility functions
    │   │   ├── api.js      # API calls
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── App.jsx         # Main App component
    │   └── main.jsx        # React entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI and JWT secret:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/skillbridge
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will run on `http://localhost:3000`

## API Endpoints

### Authentication Routes (`/api/auth`)

- **POST** `/register` - Register a new user
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }
  ```

- **POST** `/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **GET** `/profile` - Get user profile (requires authentication)

## User Roles

- **User**: Can take courses, track progress, earn certificates
- **Admin**: Can manage courses, view analytics, manage users (future implementation)

## Tech Stack

### Backend
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool
- **CSS3** - Styling

## Available Scripts

### Backend

```bash
npm run dev    # Start development server with nodemon
npm start      # Start production server
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Future Enhancements

- [ ] Google OAuth integration
- [ ] Email verification
- [ ] Course enrollment system
- [ ] Video streaming
- [ ] Course creation dashboard for admins
- [ ] Progress analytics
- [ ] Certificate generation
- [ ] Discussion forums
- [ ] Mobile app (React Native)
- [ ] Payment integration

## Contributing

1. Create a feature branch
2. Make your changes
3. Push to the branch
4. Create a pull request

## License

MIT

## Support

For issues and questions, please reach out to the development team.