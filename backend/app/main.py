from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import uuid
import io

import PyPDF2
import os

from groq import Groq   # <<===== NEW

if __name__ == "__main__":
    import os
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    models = client.models.list()
    print("\n=== Available Models ===")
    for m in models.data:
        print(m.id)


app = FastAPI(title="AI Research Paper Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    document_id: str
    question: str

class AskResponse(BaseModel):
    answer: str

documents: Dict[str, str] = {}

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text_chunks = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_chunks.append(page_text)
    return "\n".join(text_chunks)

def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Please export it in your environment.")
    return Groq(api_key=api_key)


def build_prompt(context: str, question: str) -> str:
    return f"""You are a helpful AI research-paper assistant.
You are given the text extracted from an academic paper. Answer the user's question using ONLY this context.
If the answer is not clearly in the paper, say that it is not specified in the text.

=== Paper Text ===
{context[:12000]}

=== Question ===
{question}

Provide a clear, structured answer in 3–7 bullet points.
"""

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Research Paper Assistant API is running."}

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    file_bytes = await file.read()
    try:
        text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    doc_id = str(uuid.uuid4())
    documents[doc_id] = text

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "char_count": len(text),
    }

@app.post("/ask", response_model=AskResponse)
async def ask_question(payload: AskRequest):
    doc_id = payload.document_id
    question = payload.question.strip()

    if not doc_id or doc_id not in documents:
        raise HTTPException(status_code=404, detail="Unknown or missing document_id. Upload a PDF first.")
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    context = documents[doc_id]

    try:
        client = get_client()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    prompt = build_prompt(context, question)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",     # Recommended latest model

            messages=[
                {"role": "system", "content": "You explain research papers simply and clearly."},
                {"role": "user", "content": prompt},
            ]
        )
        answer = response.choices[0].message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {e}")

    return AskResponse(answer=answer)
