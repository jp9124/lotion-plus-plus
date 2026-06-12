import json
import os

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


def _request_data(event):
    params = event.get("queryStringParameters") or {}

    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except json.JSONDecodeError:
            return None
        return {**params, **body}

    return params


def delete_handler(event, context):
    data = _request_data(event)

    if data is None:
        return _response(400, {"message": "Request body must be valid JSON"})

    email = data.get("email")
    note_id = data.get("id")

    if not email or not note_id:
        return _response(400, {"message": "Missing required fields: email and id"})

    table.delete_item(
        Key={
            "email": email,
            "id": note_id
        }
    )

    return _response(200, {"deleted": True, "id": note_id})
