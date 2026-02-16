# Cashnote - Personal Finance Management Application

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express.js-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
</p>

Cashnote is a comprehensive personal finance management web application that helps you track your income and expenses with an intuitive dashboard and powerful analytics tools.

## 🚀 Features

- **📊 Financial Dashboard** - Visual overview of your financial health with interactive charts showing spending trends
- **💰 Transaction Management** - Easily add, view, and manage income and expense transactions
- **🔐 Secure Authentication** - User registration and login with JWT-based authentication
- **📱 Responsive Design** - Fully responsive interface that works seamlessly on desktop and mobile devices
- **🎨 Modern UI** - Clean and modern interface built with TailwindCSS
- **📈 Analytics** - Transaction summaries and chart data for better financial insights

## 🛠 Tech Stack

### Frontend

| Technology  | Version |
| ----------- | ------- |
| Next.js     | 16.1.6  |
| React       | 19.2.3  |
| TailwindCSS | Latest  |
| Recharts    | Latest  |
| Axios       | Latest  |

### Backend

| Technology | Version |
| ---------- | ------- |
| Node.js    | 18+     |
| Express.js | Latest  |
| Prisma ORM | Latest  |
| PostgreSQL | Latest  |
| JWT        | Latest  |

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn** package manager

## 🏁 Getting Started

### 1. Clone the Repository

```
bash
git clone https://github.com/jodijonatan/cashnote.git
cd cashnote
```

### 2. Backend Setup

```
bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment example file
cp .env.example .env
```

Configure your `.env` file:

```
env
DATABASE_URL="postgresql://username:password@localhost:5432/cashnote_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

```
bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start backend development server
npm run dev
```

### 3. Frontend Setup

Open a new terminal window:

```
bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

### 4. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint             | Description                     |
| ------ | -------------------- | ------------------------------- |
| POST   | `/api/auth/register` | Register a new user             |
| POST   | `/api/auth/login`    | Authenticate user and get token |

### Transaction Endpoints

```

### Common Issues & Solutions

1. **Database Connection Error**
   - Pastikan PostgreSQL berjalan
   - Cek koneksi string di .env
   - Pastikan database sudah dibuat

2. **CORS Error**
   - Pastikan backend dan frontend berjalan
   - Cek konfigurasi CORS di backend

3. **Authentication Issues**
   - Cek JWT_SECRET di backend
   - Clear browser localStorage jika ada token lama

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
```
