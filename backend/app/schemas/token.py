from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None
    rti: str | None = None
    type: str | None = None
    jti: str | None = None
