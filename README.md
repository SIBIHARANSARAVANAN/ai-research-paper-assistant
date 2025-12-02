# AI Research Paper Assistant

End-to-end project: FastAPI backend + React (Vite) frontend.

## Features

- Upload a PDF research paper.
- Backend extracts the text with PyPDF2.
- Ask natural-language questions about the paper.
- Answers from an LLM (OpenAI API) constrained to the document context.
- Professional, dark-themed UI with:
  - Step-by-step layout (upload → ask → review).
  - Conversation history.
  - Context card for the current paper.
  - Helpful example questions.

## How to Run

1. Start the backend (port 8001 by default):

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   export OPENAI_API_KEY="YOUR_KEY_HERE"
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

2. Start the frontend (port 5173 by default):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open the frontend URL (e.g. http://localhost:5173) in your browser.

> Plug this entire folder into a zip and you can share it as a portfolio-ready AI research paper assistant project.