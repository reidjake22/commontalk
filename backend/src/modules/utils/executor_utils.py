from concurrent.futures import ThreadPoolExecutor

EXECUTOR: ThreadPoolExecutor | None = None

def init_executor(max_workers: int = 2):
    global EXECUTOR
    EXECUTOR = ThreadPoolExecutor(max_workers=max_workers)

def submit(fn, *args, **kwargs):
    assert EXECUTOR is not None, "Executor not initialized"
    return EXECUTOR.submit(fn, *args, **kwargs)
