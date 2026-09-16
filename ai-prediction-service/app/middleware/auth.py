import jwt
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from app.core.config import settings

security = HTTPBearer(auto_error=False)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token has expired."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid JWT token."
        )

async def get_current_user_or_service(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Validates either:
    1. Internal microservice signature via 'X-Internal-Service-Key' header (Gateway/Backend call)
    2. User JWT token via 'Authorization: Bearer <token>' header
    """
    internal_key = request.headers.get("X-Internal-Service-Key")
    if internal_key and internal_key == settings.INTERNAL_SERVICE_KEY:
        return {
            "type": "INTERNAL_SERVICE",
            "role": "SYSTEM",
            "id": "gateway_service"
        }

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header or X-Internal-Service-Key header."
        )

    payload = decode_jwt_token(credentials.credentials)
    payload["type"] = "USER"
    return payload

def authorize_family_member_access(user: Dict[str, Any], family_member_id: str):
    """
    Enforces authorization:
    - Internal system calls are granted access.
    - DOCTOR / ADMIN / DEPARTMENT_HEAD roles are granted access when authorized.
    - FAMILY role can access only their own family member IDs.
    """
    if user.get("type") == "INTERNAL_SERVICE":
        return True

    role = user.get("role", "").upper()
    if role in ["DOCTOR", "ADMIN", "DEPARTMENT_HEAD", "HOSPITAL_ADMIN", "CHAIRMAN"]:
        return True

    if role == "FAMILY":
        # Check if user owns the family member or matches ID
        user_member_ids = user.get("family_member_ids", [])
        user_id = user.get("sub") or user.get("user_id") or user.get("id")

        if family_member_id == user_id or family_member_id in user_member_ids:
            return True

        # Fallback check if user ID matches pattern
        if user_id and str(user_id) in family_member_id:
            return True

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized user role for AI prediction service."
    )
