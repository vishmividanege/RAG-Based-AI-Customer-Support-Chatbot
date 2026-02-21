from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

load_dotenv()

# Hugging Face Inference API token
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "YOUR_HF_API_KEY") 
client = InferenceClient(token=HF_API_TOKEN)

# Modern instruct model
MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"

class RAGPipeline:
    def __init__(self):
        # Free embeddings model
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = None
        self.documents = []

    def build_index(self, documents):
        self.documents = documents
        embeddings = self.embed_model.encode(documents, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)

    def retrieve(self, query, top_k=3):
        query_vec = self.embed_model.encode([query])
        distances, indices = self.index.search(query_vec, top_k)
        return [self.documents[i] for i in indices[0]]

def generate_answer_hf_stream(context_docs, user_query):
    """
    Generates answer using Hugging Face Inference API with chat_completion (streaming)
    """
    context_text = "\n\n".join(context_docs)
    
    messages = [
        {
            "role": "system",
            "content": "You are a professional customer support assistant. Your task is to provide a single, concise answer to the user's question using ONLY the provided context. Do NOT include any other questions or answers from the context. If the answer is not found in the context, say 'I don't know.' Stop immediately after providing the answer."
        },
        {
            "role": "user",
            "content": f"Context:\n{context_text}\n\nUser Question: {user_query}"
        }
    ]

    # Manual stop detection to ensure absolute safety
    stop_words = ["Question:", "Question", "Answer:", "User Question:"]
    accumulated_text = ""

    try:
        for message in client.chat_completion(
            model=MODEL_ID,
            messages=messages,
            max_tokens=250,
            stream=True
        ):
            token = message.choices[0].delta.content
            if token:
                accumulated_text += token
                
                # Check if any stop word has appeared in the stream
                should_stop = False
                for stop_word in stop_words:
                    if stop_word in accumulated_text:
                        # Yield everything BEFORE the stop word and then break
                        final_chunk = token.split(stop_word)[0]
                        if final_chunk:
                            yield final_chunk
                        should_stop = True
                        break
                
                if should_stop:
                    break
                
                yield token
    except Exception as e:
        yield f"Error in generation: {str(e)}"