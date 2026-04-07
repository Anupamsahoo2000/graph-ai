# 🌐 Graph-Based Data Modeling and Query System

Welcome to the **Context Graph System**! This application takes scattered business data (Orders, Deliveries, Invoices, Payments) and turns it into a beautiful, interactive visual map. It also features a built-in AI assistant ("Dodge AI") to answer your questions instantly.

### 🌟 Live Demo
[Click here to view the live project!](https://graph-ai-beta.vercel.app/)

### 🚀 Key Features
* **Visual Data Graph**: See exactly how your business data connects in a real-time, interactive node map.
* **AI Chatbot**: Ask natural language questions and get accurate answers instantly.
* **Secure & Smart**: The AI securely translates your English into database queries without ever modifying your raw data.
* **High Performance**: Built with React 19, Node.js, and supported by a robust PostgreSQL database.

### 💬 What can you ask AI?
Not sure where to start? Try asking the AI one of these few example questions:
1. "How many unique orders exist in the database?"
2. "Show me all the deliveries linked to Order ID 740520."
3. "Count how many invoices exist in the system."
4. "What are the total quantities for all Order Items?"
5. "Trace the journey from Order to its related Payment amounts."
6. "Which products are associated with the highest number of Dalivary?"

---

### 🛠️ Tech Stack
* **Frontend**: React (Vite), Tailwind CSS, React Flow
* **Backend**: Node.js, Express, Sequelize ORM
* **Database**: PostgreSQL (Hosted on Render)
* **AI Engine**: gemini-3-flash-preview

### 💻 Developer Quick Start
Want to run the codebase locally? 
1. **Frontend**: Navigate to `/frontend` -> run `npm install` -> `npm run dev`
2. **Backend**: Navigate to `/backend` -> configure your `.env` Database variables -> run `npm install` -> run `node scripts/transfromAndSeed.js` to populate data -> run `node server.js`
