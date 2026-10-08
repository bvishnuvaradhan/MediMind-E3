import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("ai_service.services.groq")

class GroqService:
    @staticmethod
    async def generate_explanation(model_type: str, prediction_result: Dict[str, Any], metadata: Dict[str, Any] = None) -> Optional[str]:
        """
        Generates a natural language explanation for a primary model's prediction using Groq API.
        Fails silently and returns None if Groq is disabled, unavailable, or errors out, ensuring
        primary model results are always returned to the client.
        """
        groq_enabled = os.getenv("GROQ_ENABLED", "false").lower() == "true"
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        
        if not groq_enabled or not groq_api_key:
            return None
            
        try:
            import httpx
            
            # Formulate the prompt based on the primary model's output
            prompt = f"As a medical AI assistant, explain the following primary model prediction result for {model_type} in 2-3 sentences. Keep it professional but accessible to a patient. Result: {prediction_result}"
            if metadata:
                prompt += f" Context metadata: {metadata}"
                
            model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
            
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful, empathetic medical AI assistant that explains raw model outputs."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 150
            }
            
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    logger.warning(f"Groq API returned non-200 status: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.warning(f"Groq explanation generation failed (fallback triggered): {str(e)}")
            return None
