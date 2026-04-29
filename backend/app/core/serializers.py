"""
Utilitaire de sérialisation pour les documents Beanie.

Pydantic v2 + Beanie : `model_dump()` retourne des `PydanticObjectId`
(alias de `bson.ObjectId`) que FastAPI ne sait pas sérialiser en JSON.
`mode='json'` convertit aussi les `datetime` en ISO-8601 string.
"""
from beanie import Document
from beanie.odm.fields import PydanticObjectId
from bson import ObjectId


def _conv(v):
    """Convertit récursivement ObjectId → str (les datetime sont déjà str via mode='json')."""
    if isinstance(v, (PydanticObjectId, ObjectId)):
        return str(v)
    if isinstance(v, dict):
        return {k: _conv(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_conv(i) for i in v]
    return v


def doc_to_dict(doc: Document, exclude: set | None = None) -> dict:
    """
    Sérialise un Document Beanie en dict JSON-compatible.
    - `mode='json'` → datetime converti en ISO-8601, enum en string
    - `id` est toujours converti en str
    - `revision_id` interne est exclu
    - Les champs dans `exclude` sont exclus
    """
    skip = (exclude or set()) | {"id", "revision_id"}
    # mode='json' sérialise datetime, Enum, etc. en types JSON natifs
    raw = doc.model_dump(mode="json", exclude=skip)
    result = _conv(raw)
    result["id"] = str(doc.id)
    return result


def docs_to_list(docs: list[Document], exclude: set | None = None) -> list[dict]:
    """Sérialise une liste de Documents Beanie."""
    return [doc_to_dict(d, exclude) for d in docs]
