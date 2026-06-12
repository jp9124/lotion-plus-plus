import json
import os

import boto3
from boto3.dynamodb.conditions import Key


table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }


def get_handler(event, context):
    params = event.get("queryStringParameters") or {}
    email = params.get("email")

    if not email:
        return _response(400, {"message": "Missing required query parameter: email"})

    result = table.query(
        KeyConditionExpression=Key("email").eq(email)
    )

    notes = [
        {key: value for key, value in item.items() if key != "email"}
        for item in result.get("Items", [])
    ]

    notes = sorted(
        notes,
        key=lambda note: note.get("date", ""),
        reverse=True
    )

    return _response(200, {"notes": notes})
