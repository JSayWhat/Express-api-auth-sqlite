# Express API with SQLite

This project is a backend CRUD application built with Express.js and SQLite. It includes user authentication, role-based access control, and session management.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Features

- User authentication with JWT
- Role-based access control (Admin, SuperAdmin, Editor, User)
- Session management with automatic session timeout
- Email verification for user registration
- Logging of errors and requests
- Secure HTTP headers with Helmet
- CORS support

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/your-username/express-api-sqlite.git
   cd express-api-sqlite
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```env
   APP_NAME="Express_Auth"
   PORT=3500
   APP_URL="https://localhost:3500"
   NODE_ENV="DEVELOPMENT"
   COOKIE_SECURE="false"
   COOKIE_SAME_SITE="Lax"
   SSL_CERT="ssl/selfsigned.crt"
   SSL_KEY="ssl/selfsigned.key"
   SUPER_ADMIN_EMAIL="Admin@localhost.test"
   SUPER_ADMIN_PASSWORD="!adminPassword123"
   EMAIL_HOST="localhost"
   EMAIL_PORT=1025
   EMAIL_USER="project.2"
   EMAIL_PASS="secret.2"
   EMAIL_FROM="Do-Not-Relpy@LocalhostDev.com"
   VERIFY_EMAIL_URL="https://localhost:3500/auth/verify-email"
   DATABASE_URL=""
   DATABASE_DIR=""
   DEFAULT_DATABASE_DIR="database"
   DEFAULT_DATABASE_FILE="default_database.sqlite"
   SESSION_TOKEN_SECRET="a7138b5f6aadacc54ae8aadfb416f2b8e8718e218c0a5d5dbb96cda05e742785"
   ACCESS_TOKEN_EXPIRE="30m"
   REFRESH_TOKEN_EXPIRE="1d"
   SESSION_TOKEN_EXPIRE="1hr"
   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   EMAIL_ENCRYPTION_KEY=9a5b7a00e88680075d447ead3350a43051a9fe55b16492447438f25b8d7e65f8
   KEY_COUNT=200
   ENCRYPTION_ALGORITHM=aes-256-cbc
   ```

4. Start the server:
   ```sh
   npm run dev
   ```

## Usage

- Access the API at `https://localhost:3500`
- Use tools like Postman to test the endpoints

## Environment Variables

- `APP_NAME`: Your application name
- `PORT`: The port your server will run on
- `APP_URL`: The URL of your application
- `NODE_ENV`: The environment mode (DEVELOPMENT or PRODUCTION)
- `COOKIE_SECURE`: Set cookies as httpOnly if true
- `COOKIE_SAME_SITE`: SameSite attribute for cookies
- `SSL_CERT`: Path to your SSL certificate
- `SSL_KEY`: Path to your SSL key
- `SUPER_ADMIN_EMAIL`: Default SuperAdmin email
- `SUPER_ADMIN_PASSWORD`: Default SuperAdmin password
- `EMAIL_HOST`: Email server host
- `EMAIL_PORT`: Email server port
- `EMAIL_USER`: Email server user
- `EMAIL_PASS`: Email server password
- `EMAIL_FROM`: Email sender address
- `VERIFY_EMAIL_URL`: URL for email verification
- `DATABASE_URL`: URL for the database
- `DATABASE_DIR`: Directory for the database
- `DEFAULT_DATABASE_DIR`: Default directory for the database
- `DEFAULT_DATABASE_FILE`: Default database file
- `SESSION_TOKEN_SECRET`: Secret for session tokens
- `ACCESS_TOKEN_EXPIRE`: Expiration time for access tokens
- `REFRESH_TOKEN_EXPIRE`: Expiration time for refresh tokens
- `SESSION_TOKEN_EXPIRE`: Expiration time for session tokens
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `EMAIL_ENCRYPTION_KEY`: Key for email encryption
- `KEY_COUNT`: Number of keys to keep in the key rotation list
- `ENCRYPTION_ALGORITHM`: Algorithm for encryption

## API Endpoints

- `GET /api/users`: Get all users
- `POST /api/users/add`: Add a new user
- `PUT /api/users/:userId/update`: Update a user
- `DELETE /api/users/:userId/del`: Delete a user
- `GET /api/users/:userId`: Get a user by ID

## License

This project is licensed under the ISC License.
