def messages(prompt, input):
    lines = prompt.strip().splitlines()
    results = []
    t = None
    m = ""
    for line in lines:
        if line.startswith("/"):
            if t is not None:
                results.append((t, m))
            t = line[1:].strip()
            m = ""
        else:
            m += line + "\n"
    results.append((t, m))
    results.append(('human', input))
    return [typed_message(t, m) for (t, m) in results]

def typed_message(t, m):
    if t == "system":
        return {"role": "system", "content": m}
    if t == "human":
        return {"role": "user", "content": m}
    if t == "ai":
        return {"role": "assistant", "content": m}
    raise Exception("Unknown message type in prompt: " + t)
