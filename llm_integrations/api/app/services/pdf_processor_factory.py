"""
Factory for creating PDF processors based on the provider.
"""
import os
import logging
from typing import Any, Dict

from app.services.gemini_pdf_processor import GeminiPDFProcessor

# Configure logging
logger = logging.getLogger(__name__)

class PDFProcessorFactory:
    """Factory for creating PDF processors with singleton pattern."""
    
    # Store singleton instances
    _instances: Dict[str, Any] = {}

    @classmethod
    def get_processor(cls, provider: str = "gemini") -> Any:
        """Get a processor instance based on the provider.
        
        Args:
            provider: The LLM provider to use. Options: "gemini"
            
        Returns:
            PDF processor instance
            
        Raises:
            ValueError: If the provider is not supported or API key is missing
        """
        # Check if we already have a cached instance
        if provider in cls._instances:
            logger.info(f"Using existing {provider} processor instance")
            return cls._instances[provider]
        
        # Create a new instance
        logger.info(f"Creating new {provider} processor instance")
        
        if provider == "gemini":
            google_api_key = os.environ.get("GOOGLE_API_KEY")
            if not google_api_key:
                raise ValueError("Google API key not configured (GOOGLE_API_KEY)")
                
            # Create and store the instance
            cls._instances[provider] = GeminiPDFProcessor(google_api_key=google_api_key)
            return cls._instances[provider]
        else:
            raise ValueError(f"Unsupported provider: {provider}. Supported option is 'gemini'")