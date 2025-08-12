from groq import Groq
import json
from typing import List
from .utils import clean_llm_response
from ..utils.message_utils import messages
from .prompts import system_prompt

def extract_points(model_input, retries=3) -> List[str]:
    """ Generates points for a given prompt and input. """
    client = Groq(api_key="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")
    message_list = messages(system_prompt, model_input)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=message_list,
        temperature=0.0,
        top_p=0.9,
        stop = None,
        stream=False,
    )
    message = response.choices[0].message.content
    tokens = response.usage.total_tokens
    
    try:
        cleaned_message = clean_llm_response(message)

        obj = json.loads(cleaned_message)
        # LLM sometimes returns valid JSON string
        if isinstance(obj, str):
            obj = [obj]
        items = [a.strip() for a in obj]
        items = filter(None, items)  # omit empty strings
        return list(items)
    except json.decoder.JSONDecodeError as e:
        print("JSON error:", e)
        print("Input was:", model_input)
        print("Response was:", response)
        if retries > 0:
            print("Retrying...")
            return extract_points(model_input, retries - 1)
        else:
            print("Silently giving up on trying to generate valid list.")
            return []
    