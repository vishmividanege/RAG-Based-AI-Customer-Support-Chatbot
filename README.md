# RAG-Based AI Customer Support Chatbot

An advanced, real-time AI customer support chatbot built using **FastAPI**, **React**, and **Retrieval-Augmented Generation (RAG)**.

## 🚀 Features
- **Real-time Streaming**: Responses appear word-by-word for a smooth user experience.
- **RAG Architecture**: Uses FAISS and Sentence-Transformers to retrieve relevant context from a customer support FAQ dataset.
- **Modern UI**: A sleek, dark-themed glassmorphism interface built with React, Tailwind CSS, and Framer Motion.
- **High Performance**: Powered by the `zephyr-7b-beta` model via Hugging Face Inference API.

## 🛠️ Tech Stack
- **Backend**: FastAPI, Uvicorn, FAISS, Sentence-Transformers, Hugging Face Hub.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React.

## 📦 Installation & Setup

### 1. Prerequisities
- Python 3.10+
- Node.js & npm

### 2. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your Hugging Face Token
echo "HF_API_TOKEN=your_token_here" > .env

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

## 📄 License
MIT
