from openai import OpenAI

def embed(point):
    client = OpenAI(api_key="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")

    try:
        text = point.replace("\n", " ").replace("\r", " ").strip()
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-large",
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding for point '{text}': {e}")
        return None