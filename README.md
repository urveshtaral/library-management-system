📚 Library Management System (LMS) 🚀
A modern, full-stack MERN application designed to simplify library operations. Whether it's managing a massive book collection, tracking student borrowings, or handling administrative tasks, this system provides a seamless and responsive experience.

🌟 Key Features
🔐 Role-Based Access: Secure Login/Signup for both Students and Admins with JWT authentication.

📖 Inventory Management: Admins can easily Add, Update, and Delete books from the digital catalog.

🔄 Issue & Return Logic: Automated tracking of book status, due dates, and borrowing history.

🔍 Smart Search: Instant filtering by book title, author, or ISBN to find resources quickly.

🎨 Sleek UI/UX: Custom CSS styling for a clean, professional, and mobile-responsive interface.

📊 Admin Insights: A dedicated dashboard to monitor total users, issued books, and pending returns.

🛠️ Tech Stack
Frontend: ⚛️ React.js (Hooks & Context API)

Backend: 🟢 Node.js & 🚂 Express.js

Database: 🍃 MongoDB (NoSQL)

Styling: 🎨 CSS3 (Custom Modules & Flexbox/Grid)

Auth: 🛡️ JSON Web Tokens (JWT) & Bcrypt

⚙️ Installation & Setup
Follow these steps to set up the project locally:

1️⃣ Clone the Repository
Bash

git clone https://github.com/urveshtaral/library-management-system.git
cd library-management-system
2️⃣ Backend Setup
Bash

cd backend
npm install
Create a .env file in the backend folder:

PORT = 5000
MONGO_URI = your_mongodb_connection_string
JWT_SECRET = your_secret_key
Start the server:

npm start

3️⃣ Frontend Setup

cd ../frontend
npm install
npm start
📁 Project Structure
Plaintext

├── backend/
│   ├── models/      # MongoDB Schemas (Book, User, Transaction)
│   ├── routes/      # Express API Endpoints
│   ├── middleware/  # Auth & Admin protectors
│   └── server.js    # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI (Navbar, Footer, Cards)
│   │   ├── pages/      # Home, Dashboard, Login, Inventory
│   │   └── assets/     # Stylesheets (CSS) and Images
│   └── package.json
└── README.md

📽️ Demo
You can download the output recording (demo/demo.mp4) to see how the app works.

.

👩‍💻 Author
urveshtaral
GitHub: @urveshtaral
