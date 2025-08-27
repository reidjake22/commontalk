from openai import OpenAI
import os

def embed(point):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        text = point.replace("\n", " ").replace("\r", " ").strip()
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-large",
        )
        return response.data[0].embedding
    except Exception as e:
        return None