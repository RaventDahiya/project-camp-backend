# Project Camp Backend

Project Camp is a robust and scalable backend service for a collaborative project management application. It provides a complete set of APIs for managing users, projects, tasks, and subtasks, with a strong focus on security, data integrity, and role-based access control.

## ✨ Features

- **User Authentication**: Secure user registration with email verification, JWT-based login (access/refresh tokens stored in secure cookies), and comprehensive password management (forgot/reset/change).
- **Project Collaboration**: Full CRUD functionality for projects. Invite members to projects and manage their access with distinct roles (ADMIN, MEMBER).
- **Task Management**: Full CRUD operations for tasks within projects, including assignment to specific users, status updates (e.g., To Do, In Progress, Done), and file attachments.
- **Subtask Functionality**: Break down complex tasks into smaller, manageable subtasks with individual completion tracking.
- **Role-Based Access Control (RBAC)**: Secure middleware protects routes and actions, ensuring that users can only perform operations permitted by their role within a project.
- **Cloud File Uploads**: Seamlessly upload and manage user avatars and task attachments using Multer and Cloudinary. The system automatically handles the deletion of old files from cloud storage to save space.
- **Transactional Integrity**: Guarantees data consistency by using database transactions for critical multi-step operations, such as deleting a task along with all its associated subtasks and cloud-hosted attachments.

## 🛠️ Tech Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/), [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing
- **File Storage**: [Cloudinary](https://cloudinary.com/) for cloud storage, [Multer](https://github.com/expressjs/multer) for handling multipart/form-data
- **Email Service**: [Nodemailer](https://nodemailer.com/), [Mailgen](https://github.com/eladnava/mailgen) for generating beautiful HTML emails
- **Validation**: [express-validator](https://express-validator.github.io/docs/) for robust input validation
- **Development**: [Nodemon](https://nodemon.io/) for live-reloading, [Prettier](https://prettier.io/) for code formatting

## 📊 Data Model

The database schema and entity relationships for this project were designed using Eraser. You can view the detailed data model here:

[**View Data Model on Eraser.io**](https://app.eraser.io/workspace/2fYshQMslcFlcMpHljwT)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A running [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud-based like MongoDB Atlas)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/project-camp-backend.git
    cd project-camp-backend
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary variables. See the Environment Variables section below for details.

4.  **Run the development server:**
    ```sh
    npm start
    ```
    The server will start on the port specified in your `.env` file (e.g., `http://localhost:8000`).

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=http://localhost:3000

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
ACCESS_TOKEN_SECRET=your_super_secret_access_token
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer Configuration (using Gmail as an example)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_gmail_app_password
```

## 🗺️ API Endpoints

The API is structured around REST principles. Here are some of the main endpoints:

- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Log in a user and receive tokens
- `POST /api/v1/users/logout` - Log out the current user
- `PATCH /api/v1/users/update-avatar` - Update the current user's avatar
- `POST /api/v1/projects` - Create a new project
- `GET /api/v1/projects/:projectId` - Get details of a project
- `POST /api/v1/tasks/:projectId` - Create a new task in a project
- `DELETE /api/v1/tasks/:projectId/:taskId` - Delete a task and its subtasks
- `POST /api/v1/subtasks/:projectId/:taskId` - Create a new subtask for a task

## 🧪 API Testing with Postman

A comprehensive Postman collection is available to test all the API endpoints. It includes pre-configured requests for all operations, making it easy to interact with the API.

[!Run in Postman](https://ravent-3541858.postman.co/workspace/ravent's-Workspace~de0d8adf-15fe-4874-87ea-72e8cc1747a7/collection/44650467-341be720-8300-4756-a82e-9dbc9de121de?action=share&source=collection_link&creator=44650467)

## 📄 License

This project is licensed under the ISC License.
