import json
import os
import uuid
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import boto3


table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
google_client_id = os.environ.get("GOOGLE_CLIENT_ID")


def _response(status_code, body=None):
    response = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        }
    }

    if body is not None:
        response["body"] = json.dumps(body)

    return response


def _method(event):
    return event.get("requestContext", {}).get("http", {}).get("method", "")


def _headers(event):
    return {
        key.lower(): value
        for key, value in (event.get("headers") or {}).items()
    }


def _token(headers):
    value = headers.get("access_token") or headers.get("access-token")
    authorization = headers.get("authorization", "")

    if not value and authorization.lower().startswith("bearer "):
        value = authorization[7:].strip()

    return value


def _get_json(url, headers=None):
    request = Request(url, headers=headers or {})
    with urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def _user_info(token):
    return _get_json(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {token}"}
    )


def _token_info(token):
    escaped = quote(token)

    try:
        info = _get_json(
            f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={escaped}"
        )
        if not info.get("email"):
            info.update(_user_info(token))
        return info
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        pass

    try:
        return _get_json(
            f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={escaped}"
        )
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None


def _authenticated_email(event):
    headers = _headers(event)
    email = headers.get("email")
    token = _token(headers)

    if not email or not token:
        return None

    info = _token_info(token)
    if not info:
        return None

    token_email = info.get("email")
    email_verified = info.get("email_verified")
    audience = info.get("aud")

    if not token_email:
        return None

    if str(email_verified).lower() == "false":
        return None

    if google_client_id and audience and audience != google_client_id:
        return None

    if token_email and token_email.lower() != email.lower():
        return None

    return email


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None


def save_handler(event, context):
    if _method(event).upper() != "POST":
        return _response(405, {"message": "Method not allowed"})

    authenticated_email = _authenticated_email(event)
    if not authenticated_email:
        return _response(401, {"message": "Unauthenticated"})

    body = _parse_body(event)
    if body is None:
        return _response(400, {"message": "Request body must be valid JSON"})

    body_email = body.get("email")
    if body_email and body_email.lower() != authenticated_email.lower():
        return _response(401, {"message": "Unauthenticated"})

    note = {
        "email": authenticated_email,
        "id": body.get("id") or str(uuid.uuid4()),
        "title": body.get("title") or "Untitled",
        "content": body.get("content") or "",
        "date": body.get("date") or datetime.now(timezone.utc).isoformat()
    }

    table.put_item(Item=note)

    public_note = {key: value for key, value in note.items() if key != "email"}
    return _response(200, {"note": public_note})
