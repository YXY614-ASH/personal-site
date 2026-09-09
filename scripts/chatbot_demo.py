"""Launch the existing Chatbot locally without using its legacy credential."""

import argparse
import importlib
import os
from pathlib import Path
import sys


def load_chatbot(source):
    source = Path(source).expanduser().resolve()
    required = ("config.py", "client.py", "agent.py", "document.py", "main.py")
    if not all((source / filename).is_file() for filename in required):
        raise ValueError("CHATBOT_PATH must point to the existing chatbot project.")
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(source))
    config = importlib.import_module("config")
    api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if api_key and api_key == config.API_KEY:
        raise ValueError("Replace the legacy exposed credential before connecting DeepSeek.")
    # Override before importing client.py, which creates its SDK client on import.
    config.API_KEY = api_key or "local-tools-only"
    client = importlib.import_module("client")
    agent = importlib.import_module("agent")
    document = importlib.import_module("document")
    return config, client, agent, document, bool(api_key)


def local_chat(agent, document, message, history, mode=None, pdf_file=None):
    """Return real local tool output when model generation is unavailable."""
    notice = "DeepSeek 未连接；以下为本地工具执行结果，不是大模型生成的回答。"
    try:
        if mode == "课程助手Agent":
            context, summary = agent.run_agent_tools(message, pdf_file)
            yield f"{notice}\n\n{summary}\n\n{context}" if context else f"{notice}\n\n{summary}"
        elif mode == "PDF资料问答" and pdf_file:
            context, summary = document.build_pdf_context(pdf_file, message)
            yield f"{notice}\n\n{summary}\n\n{context}"
        elif mode == "PDF资料问答":
            yield "尚未上传 PDF。DeepSeek 未连接。"
        else:
            yield "DeepSeek 未连接，当前模式的模型回答暂不可用。"
    except Exception:
        yield "本地工具执行失败，请检查 PDF 文件或计算表达式。"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chatbot-path", default=os.environ.get("CHATBOT_PATH"))
    parser.add_argument("--port", type=int, default=7861)
    args = parser.parse_args()
    if not args.chatbot_path:
        parser.error("Set CHATBOT_PATH or pass --chatbot-path.")
    if not 1024 <= args.port <= 65535:
        parser.error("Port must be between 1024 and 65535.")

    cache = Path(__file__).resolve().parents[1] / ".local" / "chatbot"
    cache.mkdir(parents=True, exist_ok=True)
    os.environ["GRADIO_TEMP_DIR"] = str(cache)
    os.environ["GRADIO_ANALYTICS_ENABLED"] = "False"
    config, client, agent, document, model_configured = load_chatbot(args.chatbot_path)
    config.APP_TITLE = "Chatbot · AI 学习助手"
    config.APP_DESCRIPTION = "V0.5 · " + ("DeepSeek 已配置" if model_configured else "本地工具模式 · DeepSeek 未连接")
    config.DEFAULT_MODE = "课程助手Agent"
    if not model_configured:
        def chat(message, history, mode=None, pdf_file=None):
            yield from local_chat(agent, document, message, history, mode, pdf_file)
        client.chat_stream = chat
    entry = importlib.import_module("main")
    sys.argv = ["main.py", "--port", str(args.port), "--server-name", "127.0.0.1"]
    entry.main()


if __name__ == "__main__":
    main()
