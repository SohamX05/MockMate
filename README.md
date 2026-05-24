# MockMate - AI Mock Technical Interviewer

MockMate is a state-of-the-art, MERN-stack mock interviewer application that conducts professional, adaptive technical assessments, accepts verbal or written candidate responses, and generates beautiful interactive scorecard feedback.

---

## ⚡ One-Click Automated Deployments

Deploy your personal, production-grade instance of MockMate in a single click:

### 1. Deploy the Backend API (Render)
Click the button below to deploy the Express server. Render will read our `render.yaml` blueprint, pre-configure the `/backend` folder, and prompt you only for your `MONGO_URI` and `GEMINI_API_KEY`:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SohamX05/MockMate)

*(Copy the assigned Render URL once the deployment completes, e.g. `https://mockmate-api.onrender.com`)*

### 2. Deploy the Frontend UI (Vercel)
Click the button below to deploy the React client. Vercel will configure the `/frontend` root directory and prompt you for the API endpoint:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSohamX05%2FMockMate&root-directory=frontend&env=VITE_API_BASE_URL)

*(Paste your Render API URL into the `VITE_API_BASE_URL` variable during setup!)*

---

## 🛠️ Local Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### Step 1: Set Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_signing_key
```

### Step 2: Start the Backend Server
```bash
cd backend
npm install
npm run dev
```

### Step 3: Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** to test your local installation!
