from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.utils import load_faq_dataset
from app.rag_pipeline import RAGPipeline, generate_answer_hf_stream
from fastapi.middleware.cors import CORSMiddleware
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(title="RAG Customer Support Chatbot")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


faq_docs = load_faq_dataset()


rag = RAGPipeline()
rag.build_index(faq_docs)


class Query(BaseModel):
    question: str


@app.post("/chat")
async def chat(query: Query):
    try:
        logger.info(f"Received question: {query.question}")
        retrieved_docs = rag.retrieve(query.question)
        return StreamingResponse(
            generate_answer_hf_stream(retrieved_docs, query.question),
            media_type="text/plain"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running on 0.0.0.0:8000"}