# NextDoorBuddy

A neighborhood community platform that connects neighbors for local exchanges, events, and community building.

## 🏘️ Features

### Core Functionality
- **Neighborhood-based System**: Users are assigned to specific neighborhoods and can only see content from their area
- **Troc System**: Local exchange marketplace for goods and services
- **User Management**: Registration, authentication, and profile management
- **Admin Panel**: Administrative interface for managing users, neighborhoods, and content

### User Features
- **Secure Authentication**: JWT-based authentication with token refresh
- **Profile Management**: Update personal information and change neighborhoods
- **Troc Creation**: Create exchange announcements with images
- **Neighborhood Filtering**: View only content from your assigned neighborhood
- **Image Upload**: Support for multiple images per troc announcement

### Admin Features
- **User Management**: View, edit, and delete user accounts
- **Neighborhood Management**: Create and manage neighborhood boundaries
- **Content Moderation**: Approve/reject troc announcements
- **Statistics Dashboard**: View platform usage statistics

## 🛠️ Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **PostgreSQL** with PostGIS for geospatial data
- **JWT** for authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

### Frontend
- **React 19** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Leaflet** for interactive maps

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **PostgreSQL** database with PostGIS extension

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProjetAnnuel-NextDoorBuddy
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Default Admin Account
- Email: `lucas.verrecchia@gmail.com`
- Password: `Admin123!`

## 📁 Project Structure

```
ProjetAnnuel-NextDoorBuddy/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── services/       # Business logic services
│   │   └── config/         # Configuration files
│   └── Dockerfile
├── frontend/nextdoorbuddy/  # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── Dockerfile
├── docker/
│   └── init/               # Database initialization scripts
└── docker-compose.yaml     # Docker orchestration
```

## 🗄️ Database Schema

### Key Tables
- **Utilisateur**: User accounts and profiles
- **Quartier**: Neighborhood definitions with geospatial data
- **AnnonceTroc**: Exchange announcements
- **UtilisateurQuartier**: Many-to-many relationship for user neighborhoods

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend/nextdoorbuddy
npm install
npm run dev
```

### Database Reset
```bash
docker-compose down
docker volume rm projetannuel-nextdoorbuddy_db_data
docker-compose up -d
```

## 🌟 Key Features Implementation

### Neighborhood Filtering
- Users can only see trocs from their assigned neighborhood
- Automatic neighborhood assignment during troc creation
- Admin can manage neighborhood boundaries

### Image Management
- Multiple image upload support
- Image compression and optimization
- Carousel display for multiple images
- Individual image deletion

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Token refresh mechanism
- Role-based access control

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Troc Endpoints
- `GET /api/troc` - Get trocs for user's neighborhood
- `POST /api/troc` - Create new troc
- `PUT /api/troc/:id` - Update troc
- `DELETE /api/troc/:id` - Delete troc

### Admin Endpoints
- `GET /api/troc/admin` - Get all trocs (admin)
- `PATCH /api/troc/admin/:id/status` - Update troc status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.