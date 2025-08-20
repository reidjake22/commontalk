from concurrent.futures import ThreadPoolExecutor
import logging

EXECUTOR: ThreadPoolExecutor | None = None

def init_executor(max_workers: int = 2):
    global EXECUTOR
    EXECUTOR = ThreadPoolExecutor(max_workers=max_workers)

def submit(fn, *args, **kwargs):
    print(f"Submitting job: {fn.__name__} with args: {args}, kwargs: {kwargs}")
    assert EXECUTOR is not None, "Executor not initialized"
    future = EXECUTOR.submit(fn, *args, **kwargs)
    def log_exception(fut):
        try:
            fut.result()
        except Exception as e:
            logging.error(f"Job failed: {e}", exc_info=True)
    future.add_done_callback(log_exception)
    return future
