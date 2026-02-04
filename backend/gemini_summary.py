"""
OpenRouter Summary Service for Maharashtra MLA Information

Uses OpenRouter AI to generate human-readable summaries about MLAs and their roles.
"""
import os
import aiohttp
from typing import Dict, Optional
import warnings
from async_lru import alru_cache
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter API configuration
openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")


def _get_fallback_summary(mla_name: str, assembly_constituency: str, district: str) -> str:
    """
    Generate a fallback summary when Gemini is unavailable or fails.

    Args:
        mla_name: Name of the MLA
        assembly_constituency: Assembly constituency name
        district: District name

    Returns:
        A simple fallback description
    """
    return (
        f"{mla_name} represents the {assembly_constituency} assembly constituency "
        f"in {district} district, Maharashtra. MLAs handle local issues such as "
        f"infrastructure, public services, and constituent welfare."
    )


@alru_cache(maxsize=100)
async def generate_mla_summary(
    district: str,
    assembly_constituency: str,
    mla_name: str,
    issue_category: Optional[str] = None
) -> str:
    """
    Generate a human-readable summary about an MLA using Gemini.

    Args:
        district: District name
        assembly_constituency: Assembly constituency name
        mla_name: Name of the MLA
        issue_category: Optional category of issue for context

    Returns:
        A short paragraph describing the MLA's role and responsibilities
    """
    if not openrouter_api_key:
        return _get_fallback_summary(mla_name, assembly_constituency, district)

    try:
        # Use OpenRouter with Llama 3.2 1B model
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json"
        }

        issue_context = f" particularly regarding {issue_category} issues" if issue_category else ""

        prompt = f"""
        You are helping an Indian citizen understand who represents them. 
        In one short paragraph (max 100 words), explain that the MLA {mla_name} represents 
        the assembly constituency {assembly_constituency} in district {district}, state Maharashtra{issue_context}, 
        and what type of local issues they typically handle.
        
        Do not hallucinate phone numbers or emails; only talk about roles and responsibilities.
        Keep it factual, helpful, and encouraging for civic engagement.
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
        print(f"OpenRouter Summary Error: {e}")
        # Fallback to simple description
        return _get_fallback_summary(mla_name, assembly_constituency, district)
