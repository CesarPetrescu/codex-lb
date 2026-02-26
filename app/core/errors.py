from __future__ import annotations

import time
from typing import Literal, NotRequired, TypedDict


class OpenAIErrorDetail(TypedDict, total=False):
    message: str
    type: str
    code: str
    param: str
    plan_type: str
    resets_at: int | float
    resets_in_seconds: int | float


class OpenAIErrorEnvelope(TypedDict):
    error: OpenAIErrorDetail


class DashboardErrorDetail(TypedDict):
    code: str
    message: str


class DashboardFieldValidationError(TypedDict):
    field: str
    message: str
    type: str


class DashboardErrorEnvelope(TypedDict, total=False):
    error: DashboardErrorDetail
    validation_errors: list[DashboardFieldValidationError]


class ResponseFailedResponse(TypedDict):
    object: str
    status: str
    error: OpenAIErrorDetail
    id: NotRequired[str]
    created_at: NotRequired[int]
    incomplete_details: NotRequired[dict[str, str] | None]


class ResponseFailedEvent(TypedDict):
    type: Literal["response.failed"]
    response: ResponseFailedResponse


def openai_error(code: str, message: str, error_type: str = "server_error") -> OpenAIErrorEnvelope:
    return {"error": {"message": message, "type": error_type, "code": code}}


def dashboard_error(
    code: str,
    message: str,
    *,
    validation_errors: list[DashboardFieldValidationError] | None = None,
) -> DashboardErrorEnvelope:
    payload: DashboardErrorEnvelope = {"error": {"code": code, "message": message}}
    if validation_errors:
        payload["validation_errors"] = validation_errors
    return payload


def response_failed_event(
    code: str,
    message: str,
    error_type: str = "server_error",
    response_id: str | None = None,
    created_at: int | None = None,
    error_param: str | None = None,
    incomplete_details: dict[str, str] | None = None,
) -> ResponseFailedEvent:
    error = openai_error(code, message, error_type)["error"]
    if error_param:
        error["param"] = error_param
    if created_at is None:
        created_at = int(time.time())
    response: ResponseFailedResponse = {
        "object": "response",
        "status": "failed",
        "error": error,
    }
    response["incomplete_details"] = incomplete_details
    if response_id:
        response["id"] = response_id
    if created_at is not None:
        response["created_at"] = created_at
    return {"type": "response.failed", "response": response}
