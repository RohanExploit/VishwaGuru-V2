import os
import aiohttp
from typing import Optional
import warnings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter API configuration
openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")


async def generate_action_plan(issue_description: str, category: str, image_path: Optional[str] = None) -> dict:
    """
    Generates an action plan (WhatsApp message, Email draft) using Gemini.
    """
    if not openrouter_api_key:
        return {
            "whatsapp": f"Hello, I would like to report a {category} issue: {issue_description}",
            "email_subject": f"Complaint regarding {category}",
            "email_body": f"Respected Authority,\n\nI am writing to bring to your attention a {category} issue: {issue_description}.\n\nPlease take necessary action.\n\nSincerely,\nCitizen"
        }

    try:
        # Use OpenRouter with Llama 3.2 1B model
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json"
        }

        prompt = f"""
        You are a civic action assistant. A user has reported a civic issue.
        Category: {category}
        Description: {issue_description}

        Please generate:
        1. A concise WhatsApp message (max 200 chars) that can be sent to authorities.
        2. A formal but firm email subject.
        3. A formal email body (max 150 words) addressed to the relevant authority (e.g., Municipal Commissioner, Police, etc. based on category).

        Return the response in strictly valid JSON format with keys: "whatsapp", "email_subject", "email_body".
        Do not use markdown code blocks. Just the raw JSON string.
        """

        data = {
            "model": "meta-llama/llama-3.2-1b-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as response:
                result = await response.json()
                text_response = result['choices'][0]['message']['content'].strip(
                )

        # Parse the JSON response
        import json
        return json.loads(text_response)

    except Exception as e:
        print(f"OpenRouter Error: {e}")
        # Fallback
        return {
            "whatsapp": f"Hello, I would like to report a {category} issue: {issue_description}",
            "email_subject": f"Complaint regarding {category}",
            "email_body": f"Respected Authority,\n\nI am writing to bring to your attention a {category} issue: {issue_description}.\n\nPlease take necessary action.\n\nSincerely,\nCitizen"
        }


async def chat_with_civic_assistant(query: str) -> str:
    """
    Chat with the civic assistant.
    """
    if not openrouter_api_key:
        return "I am currently offline. Please try again later."

    try:
        # Use OpenRouter with Llama 3.2 1B model
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json"
        }

        prompt = f"""
        You are VishwaGuru, a helpful civic assistant for Indian citizens.
        User Query: {query}

        Answer the user's question about civic issues, government services, or local administration.
        If they ask about specific MLAs, tell them to use the "Find My MLA" feature.
        Keep answers concise and helpful.
        """

        data = {
            "model": "meta-llama/llama-3.2-1b-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=data) as response:
                result = await response.json()
                return result['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"OpenRouter Chat Error: {e}")
        return "I encountered an error processing your request."
