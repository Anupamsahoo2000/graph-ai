# Graph-Based Data Modeling and Query System

This project is a high-performance **Context Graph System** with an integrated **LLM-powered Conversational Query Interface**. It ingests fragmented SAP business data (Orders, Deliveries, Invoices, and Payments) and translates it into a unified, explorable relationship graph.

Users can interact with the graph visually, or use the "Dodge AI" chat sidebar to issue natural language queries that are securely translated into SQL, executed, and explained back to the user seamlessly.

---

## 🏗️ Architecture Decisions

The system is split into a **Node.js (Express) Backend** and a **React 19 (Vite) Frontend**, prioritizing a decoupled architecture. 

* **Frontend Engine:** The UI was engineered entirely with Vanilla Tailwind CSS alongside `reactflow` to generate the interactive network map. We custom-built a dynamic force-directed algorithm inside the browser to aesthetically cluster highly connected root nodes (Orders/Customers) together alongside their satellites. 
* **State Management:** Rather than relying on rigid libraries (e.g. Redux), cross-component communication was implemented natively using lifted state. As the ChatBox captures an Entity name or Document ID from the LLM, the raw text is broadcast to the GraphView, which automatically intersects and highlights the nodes.
* **REST Execution:** The query protocol uses standard stateless HTTP requests, prioritizing stable connections. We initially explored Server-Sent Events (SSE) for streaming text, but reverted to a rigid block-return flow to ensure maximum reliability against aggressive Google API rate limits.

---

## 🗄️ Database Choice (PostgreSQL via Sequelize)

While Neo4j or ArangoDB are traditional "Graph Databases," **PostgreSQL** was chosen specifically for this ingestion payload. 
* The SAP datasets provided strictly adhere to rigid schema normalization (Foreign key pointers like \`referenceSdDocument\` and \`referenceDocument\`). 
* Using PostgreSQL (via the **Sequelize ORM**) allowed us to strictly enforce Data Integrity (Primary Key/Foreign Key mappings) during the massive `.jsonl` data dumps from scripts.
* Instead of native graph traversal (which is slow for aggregating millions of billing counts), the backend dynamically constructs logical graph \`Nodes\` and \`Edges\` purely in-memory (`graphController.js`) right before serving it to the UI. This provides the UI with standard graph shapes while letting us leverage highly optimized B-Tree relational SQL indexes for answering user counting questions!

---

## 🧠 LLM Prompting Strategy

The conversational interface relies on **Gemini 1.5 Flash**. The strategy operates as a secure **2-Phase Zero-Shot pipeline**:

1. **SQL Translation Phase**: The LLM acts strictly as a parser. It is fed a highly rigid schema blueprint.
   * **Prompting Guard:** We implemented strict literal syntax rules instructing the AI to *always use double quotes* for table names (to sidestep PostgreSQL case-sensitivity limits) and *single quotes* for string-based IDs. 
   * **Fuzzy Relationships:** The prompt includes a hard rule: \`ALWAYS use LEFT JOINs when connecting tables\`, ensuring missing document legs (e.g. an unpaid invoice) don't aggressively drop the entire query.
2. **Formatting Phase**: Once the Express backend retrieves the JSON block from PostgreSQL, it is passed completely raw to Gemini in a second prompt. The prompt demands complete Markdown-free text that accurately synthesizes the data without hallucinatory styling.

---

## 🛡️ Guardrails & Security Measures

Relying entirely on LLMs to generate unverified database operations is unsafe. The following guardrails were built into the application:

* **Keyword Verification (`isRelevantQuery`)**: Before communicating with the LLM API, the incoming query is scrubbed against a predefined array of allowed business entities (`order`, `delivery`, `invoice`, `payment`, `product`). If the system detects a completely irrelevant prompt (e.g. "Tell me a joke"), it structurally denies the request locally, saving API tokens and blocking injection attempts.
* **Read-Only Privilege**: By explicitly defining the SQL schema context fed to the LLM without giving it structural modification rules (like `DROP` or `DELETE`), the LLM restricts itself only to `SELECT` statements. Because the result executes on Sequelize bindings mapped back to the data schema, it eliminates destructive capability.
* **Failsafe Timeout Recovery**: Node.js `fetch` endpoints are rigidly wrapped by standard `AbortSignal.timeout(15000)`. If Gemini's API servers lock the socket to process massive text queries or fail under free-tier quotas, the system violently chops the network socket off and tells the frontend an error occurred naturally, preventing server lockups completely.

---

## 🚀 How to Run

1. **Clone & Install**
   Navigate to `/backend` and run `npm install`. Do the same for `/frontend`.
2. **Setup Postgres**
   Create the database in Postgres according to your `.env` variables (`DB_NAME`, `DB_USER`). 
3. **Data Generation**
   Add your Gemini API key to `.env` as `GEMINI_API_KEY`.
   Run `cd backend && node scripts/transfromAndSeed.js` to extract data from `.jsonl` files and seed the relationships.
4. **Boot Interfaces**
   * Backend: `nodemon server.js`
   * Frontend: `npm run dev`
