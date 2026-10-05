import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

def ask_groq(
    message: str,
    system_prompt: str = None,
    context: str = None,
):
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing in ai-service .env")

    client = OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )

    final_system_prompt = system_prompt or (
        "You are GoEat AI assistant."
    )

    final_user_message = message

    if context:
        final_user_message = f"""
Use this context to answer accurately.

CONTEXT:
{context}

QUESTION:
{message}
"""

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": final_system_prompt,
            },
            {
                "role": "user",
                "content": final_user_message,
            },
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content
