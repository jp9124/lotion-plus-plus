import json
import os
import uuid
from datetime import datetime, timezone

import boto3


table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }


def _parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return None


def save_handler(event, context):
    body = _parse_body(event)

    if body is None:
        return _response(400, {"message": "Request body must be valid JSON"})

    email = body.get("email")
    if not email:
        return _response(400, {"message": "Missing required field: email"})

    note = {
        "email": email,
        "id": body.get("id") or str(uuid.uuid4()),
        "title": body.get("title") or "Untitled",
        "content": body.get("content") or "",
        "date": body.get("date") or datetime.now(timezone.utc).isoformat()
    }

    table.put_item(Item=note)

    public_note = {key: value for key, value in note.items() if key != "email"}
    return _response(200, {"note": public_note})
