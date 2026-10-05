import os
import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
VECTOR_DB_DIR = os.path.join(BASE_DIR, "vector_db")

client = chromadb.PersistentClient(path=VECTOR_DB_DIR)
collection = client.get_or_create_collection(name="goeat_docs")

embedding_model = None


def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return embedding_model


def split_text(text: str, chunk_size: int = 700, overlap: int = 100):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap

    return chunks


def ingest_documents():
    documents = []
    ids = []

    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".txt"):
            file_path = os.path.join(DATA_DIR, filename)

            with open(file_path, "r", encoding="utf-8") as file:
                text = file.read()

            chunks = split_text(text)

            for index, chunk in enumerate(chunks):
                documents.append(chunk)
                ids.append(f"{filename}_{index}")

    if not documents:
        return {
            "success": False,
            "message": "No documents found inside data folder",
        }

    existing = collection.get()

    if existing and existing.get("ids"):
        collection.delete(ids=existing["ids"])

    embeddings = get_embedding_model().encode(documents).tolist()

    collection.add(
        documents=documents,
        embeddings=embeddings,
        ids=ids,
    )

    return {
        "success": True,
        "message": "Documents ingested successfully",
        "totalChunks": len(documents),
    }


def search_context(query: str, top_k: int = 3) -> str:
    query_embedding = get_embedding_model().encode([query]).tolist()[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    documents = results.get("documents", [[]])[0]

    if not documents:
        return ""

    return "\n\n".join(documents)
