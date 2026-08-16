import httpx


def send_expo_push(token: str, title: str, body: str, data: dict | None = None) -> bool:
    if not token:
        return False

    try:
        response = httpx.post(
            "https://exp.host/--/api/v2/push/send",
            json={"to": token, "title": title, "body": body, "data": data or {}},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=5.0,
        )
        return response.status_code == 200
    except httpx.HTTPError:
        return False
