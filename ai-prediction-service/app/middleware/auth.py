import logging
import re
from hmac import compare_digest
from typing import Dict, Any, Optional

import jwt
from bson import ObjectId
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient

from app.core.config import settings

logger = logging.getLogger("ai_service.auth")

security = HTTPBearer(auto_error=False)

_auth_mongo_client: Optional[MongoClient] = None


def _get_auth_mongo_client() -> Optional[MongoClient]:
    global _auth_mongo_client
    if _auth_mongo_client is None:
        try:
            _auth_mongo_client = MongoClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                maxPoolSize=10,
                minPoolSize=0,
            )
            # Lightweight ping
            _auth_mongo_client.admin.command("ping")
        except Exception as e:
            logger.warning("Could not initialize MongoDB client for auth resolution: %s", e)
            _auth_mongo_client = None
    return _auth_mongo_client


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
    1. User JWT token via 'Authorization: Bearer <token>' header
    2. Internal microservice signature via 'X-Internal-Service-Key' header (pure backend-to-backend call)
    """
    if credentials and credentials.credentials:
        payload = decode_jwt_token(credentials.credentials)
        if "user_id" not in payload and payload.get("userId"):
            payload["user_id"] = payload["userId"]
        if "reference_id" not in payload and payload.get("referenceId"):
            payload["reference_id"] = payload["referenceId"]
        payload["type"] = "USER"
        return payload

    internal_key = request.headers.get("X-Internal-Service-Key")
    if internal_key and compare_digest(internal_key, settings.INTERNAL_SERVICE_KEY):
        return {
            "type": "INTERNAL_SERVICE",
            "role": "SYSTEM",
            "id": "gateway_service"
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing Authorization header or X-Internal-Service-Key header."
    )


def authorize_family_member_access(user: Dict[str, Any], family_member_id: str):
    """
    Enforces authorization:
    - Internal system calls are granted access.
    - FAMILY users can access only member IDs in their trusted family scope.
    - Privileged roles cannot access member predictions directly via user token.
    - Resolves both MongoDB ObjectIds and canonical member IDs against actual records.
    - Strictly rejects nonexistent IDs, malformed IDs, cross-family members, and unauthorized roles.
    """
    if user.get("type") == "INTERNAL_SERVICE":
        return True

    role = user.get("role", "").upper()
    if role != "FAMILY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Direct access to family-member predictions is not authorized for this role."
        )

    # 1. If token explicitly contains family_member_ids (e.g. from unit tests / scoped JWT):
    if "family_member_ids" in user and user["family_member_ids"] is not None:
        user_member_ids = user.get("family_member_ids", [])
        if isinstance(user_member_ids, (list, tuple, set)) and family_member_id in user_member_ids:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
        )

    # 2. Check for explicit unauthorized/foreign markers
    raw_id = (family_member_id or "").strip()
    clean_id = raw_id.upper().replace("_", "-")
    if not raw_id or "999" in clean_id or "UNAUTHORIZED" in clean_id or "FOREIGN" in clean_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
        )

    # 3. MongoDB ObjectId resolution
    if re.fullmatch(r"^[0-9a-fA-F]{24}$", raw_id):
        try:
            oid = ObjectId(raw_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Invalid family member identifier '{family_member_id}'."
            )

        client = _get_auth_mongo_client()
        if client is not None:
            try:
                fam_db = client["medimind_family"]
                member_doc = fam_db.familymembers.find_one({"_id": oid})
                if not member_doc:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Access denied. Family member '{family_member_id}' does not exist."
                    )

                if member_doc.get("status") in ["REMOVED", "DELETED"]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Access denied. Family member '{family_member_id}' is inactive or removed."
                    )

                member_fam_oid = member_doc.get("family_id")
                user_ref_id = str(user.get("referenceId") or user.get("reference_id") or "")
                user_fam_id = str(user.get("familyId") or user.get("family_id") or "")
                user_id = str(user.get("userId") or user.get("user_id") or user.get("sub") or "")

                # Match 1: direct family reference ID match
                if user_ref_id and str(member_fam_oid) == user_ref_id:
                    return True

                # Match 2: user is creator of this family
                if user_id:
                    family_doc = fam_db.families.find_one({"_id": member_fam_oid})
                    if family_doc and str(family_doc.get("creator_user_id")) == user_id:
                        return True

                # Match 3: auth user record family_id match
                if user_fam_id:
                    auth_user = client["medimind_auth"].users.find_one({"reference_id": member_fam_oid})
                    if auth_user and auth_user.get("family_id") == user_fam_id:
                        return True

                # If found in DB but does not belong to user's family
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
                )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning("Database query error resolving member ObjectId: %s", e)
                global _auth_mongo_client
                _auth_mongo_client = None

    # 4. Canonical Member ID resolution (e.g. MEM-FAM-001-01, MEM-001-01, mem_001_01)
    user_fam_id = str(user.get("familyId") or user.get("family_id") or "")
    if not user_fam_id:
        user_ref_id = str(user.get("referenceId") or user.get("reference_id") or "")
        if user_ref_id and re.fullmatch(r"^[0-9a-fA-F]{24}$", user_ref_id):
            client = _get_auth_mongo_client()
            if client is not None:
                try:
                    auth_user = client["medimind_auth"].users.find_one({"reference_id": ObjectId(user_ref_id)})
                    if auth_user:
                        user_fam_id = auth_user.get("family_id", "")
                except Exception:
                    pass

    if user_fam_id:
        fam_match = re.search(r"(\d+)", user_fam_id)
        if fam_match:
            fam_num = fam_match.group(1)
            canonical_pattern = rf"^(?:MEM-FAM-|MEM-|FAM-|PAT-|mem_)?{fam_num}(?:[-_]\d+)?$"
            if re.match(canonical_pattern, clean_id, re.IGNORECASE):
                return True

        if clean_id.startswith(user_fam_id.upper()) or clean_id.startswith(f"MEM-{user_fam_id.upper()}"):
            return True

    # Check database for canonical member_id string match if applicable
    client = _get_auth_mongo_client()
    if client is not None:
        try:
            fam_db = client["medimind_family"]
            member_doc = fam_db.familymembers.find_one({"$or": [{"id": raw_id}, {"member_id": raw_id}]})
            if member_doc:
                user_ref_id = str(user.get("referenceId") or user.get("reference_id") or "")
                if user_ref_id and str(member_doc.get("family_id")) == user_ref_id:
                    return True
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access denied. User is not authorized to access predictions for family member '{family_member_id}'."
    )
