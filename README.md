# Library Management System (LMS) 🚀

A modern, full-stack **MERN application** designed to simplify library operations. Whether it's managing a massive book collection, tracking student borrowings, or handling administrative tasks, this system provides a seamless and responsive experience.

---

🌟 **Key Features**

🔐 **Role-Based Access**: Secure Login/Signup for both Students and Admins with JWT authentication.  

📖 **Inventory Management**: Admins can easily Add, Update, and Delete books from the digital catalog.  

🔄 **Issue & Return Logic**: Automated tracking of book status, due dates, and borrowing history.  

🔍 **Smart Search**: Instant filtering by book title, author, or ISBN to find resources quickly.  

🎨 **Sleek UI/UX**: Custom CSS styling for a clean, professional, and mobile-responsive interface.  

📊 **Admin Insights**: A dedicated dashboard to monitor total users, issued books, and pending returns.  

---

🛠️ **Tech Stack**

- **Frontend:** ⚛️ React.js (Hooks & Context API)  
- **Backend:** 🟢 Node.js & 🚂 Express.js  
- **Database:** 🍃 MongoDB (NoSQL)  
- **Styling:** 🎨 CSS3 (Custom Modules & Flexbox/Grid)  
- **Auth:** 🛡️ JSON Web Tokens (JWT) & Bcrypt  

---

⚙️ **Installation & Setup**

Follow these steps to set up the project locally:

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/urveshtaral/library-management-system.git
cd library-management-system
```

2️⃣ Backend Setup
```bash
cd backend
npm install
```
Create a .env file in the backend folder:
```
PORT = 5000
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_secret_key
```
Start the server:
```
npm start
```
3️⃣ Frontend Setup
```
cd ../frontend
npm install
npm start
```

📁 Project Structure
```
library-management-system/
├── backend/                    # Node.js + Express REST API
│   ├── models/                # MongoDB Schemas (Book, User, Transaction, Event, Notification)
│   ├── routes/                # Express API Endpoints (auth, books, users, events, etc.)
│   ├── middleware/            # Authentication, Authorization, Validation
│   ├── config/                # Database, Cloudinary configurations
│   ├── utils/                 # Helper functions, email service
│   ├── logs/                  # Application logs
│   ├── .env.example           # Environment variables template
│   ├── package.json           # Backend dependencies
│   └── server.js              # Entry point for backend server
├── frontend/                  # React Single Page Application
│   ├── src/
│   │   ├── components/        # 70+ Reusable UI components
│   │   ├── pages/             # Page components (Home, Dashboard, Login, etc.)
│   │   ├── dashboard/         # Admin and Member dashboard components
│   │   ├── context/           # React Context for state management
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Helper functions, constants
│   │   ├── assets/            # Images and static files
│   │   ├── App.js             # Main application component
│   │   └── index.js           # React entry point
│   ├── public/                # Static public files
│   ├── .env.example           # Frontend environment variables
│   └── package.json           # Frontend dependencies
├── docker-compose.yml         # Multi-container Docker setup
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation (this file)
└── postman_collection.json    # API testing collection
```
📽️ Demo

You can download the output recording (demo/demo.mp4) to see how the app works.

👩‍💻 Author

urveshtaral

GitHub: @urveshtaral


