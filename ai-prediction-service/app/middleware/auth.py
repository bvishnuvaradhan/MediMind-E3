import jwt
from hmac import compare_digest
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
    if internal_key and compare_digest(internal_key, settings.INTERNAL_SERVICE_KEY):
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
    # Normalize the documented camelCase identity claims for downstream
    # consumers without treating identity data as member-access authority.
    if "user_id" not in payload and payload.get("userId"):
        payload["user_id"] = payload["userId"]
    if "reference_id" not in payload and payload.get("referenceId"):
        payload["reference_id"] = payload["referenceId"]
    payload["type"] = "USER"
    return payload

def authorize_family_member_access(user: Dict[str, Any], family_member_id: str):
    """
    Enforces authorization:
    - Internal system calls are granted access.
    - FAMILY users can access only exact member IDs in their trusted scope.
    - Direct JWT access for privileged roles is denied until an authoritative,
      member-specific authorization source is integrated.
    """
    if user.get("type") == "INTERNAL_SERVICE":
        return True

    role = user.get("role", "").upper()
    if role == "FAMILY":
        user_member_ids = user.get("family_member_ids", [])
        if isinstance(user_member_ids, (list, tuple, set)) and family_member_id in user_member_ids:
            return True

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Direct access to family-member predictions is not authorized for this role."
    )
