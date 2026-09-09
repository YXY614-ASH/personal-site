"""Integration checks against the original project; no model/network calls."""

import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch


launcher_path = Path(__file__).resolve().parents[1] / "scripts" / "chatbot_demo.py"
spec = importlib.util.spec_from_file_location("chatbot_demo", launcher_path)
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class IntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": ""}):
            cls.config, cls.client, cls.agent, cls.document, cls.connected = launcher.load_chatbot(os.environ["CHATBOT_PATH"])

    def test_legacy_credential_is_not_used(self):
        self.assertFalse(self.connected)
        self.assertEqual(self.config.API_KEY, "local-tools-only")
        self.assertEqual(self.client._client.api_key, "local-tools-only")

    def test_real_calculator_works_without_model_call(self):
        with patch.object(self.client._client.chat.completions, "create", side_effect=AssertionError("No network allowed")):
            result = list(launcher.local_chat(self.agent, self.document, "计算 12*(3+4)", [], "课程助手Agent"))[-1]
        self.assertIn("84", result)
        self.assertIn("不是大模型生成", result)

    def test_real_pdf_retrieval_preserves_page_citation(self):
        fixture = Path(__file__).parent / "fixtures" / "chatbot-lesson.pdf"
        result = list(launcher.local_chat(self.agent, self.document, "PLC cycle", [], "PDF资料问答", str(fixture)))[-1]
        self.assertIn("第 1 页", result)
        self.assertIn("Read inputs", result)

    def test_tool_planning_combines_pdf_and_calculator(self):
        tools = self.agent.plan_tools("根据资料计算 12*(3+4)", "lesson.pdf")
        self.assertEqual(tools, ["pdf_search", "calculator"])

    def test_generation_modes_show_unavailable_status_without_key(self):
        for mode in ["学习助手", "题目解析卡", "学习计划卡"]:
            result = list(launcher.local_chat(self.agent, self.document, "解释电流", [], mode))[-1]
            self.assertIn("暂不可用", result)

    def test_original_regression_suite(self):
        suite = unittest.defaultTestLoader.discover(str(Path(os.environ["CHATBOT_PATH"]) / "tests"), pattern="test_client.py")
        result = unittest.TestResult()
        suite.run(result)
        self.assertGreaterEqual(result.testsRun, 15)
        self.assertTrue(result.wasSuccessful(), result.errors + result.failures)


if __name__ == "__main__":
    unittest.main(verbosity=2)
