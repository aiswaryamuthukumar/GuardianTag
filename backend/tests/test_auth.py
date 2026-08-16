import time


def test_sync_creates_user(client, make_token):
    token = make_token("user_sync_1")
    response = client.post(
        "/api/v1/auth/sync",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "sync@hostdost.dev", "full_name": "Sync User", "room_number": "A1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["clerk_user_id"] == "user_sync_1"
    assert body["email"] == "sync@hostdost.dev"
    assert body["level"] == "rookie"


def test_sync_is_idempotent_and_never_overwrites(client, make_token):
    token = make_token("user_sync_2")
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post(
        "/api/v1/auth/sync", headers=headers, json={"email": "real@hostdost.dev", "full_name": "Real Name"}
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/auth/sync",
        headers=headers,
        json={"email": "ignored@example.com", "full_name": "Should Not Overwrite"},
    )
    assert second.status_code == 200
    assert second.json()["full_name"] == "Real Name"
    assert second.json()["email"] == "real@hostdost.dev"
    assert second.json()["id"] == first.json()["id"]


def test_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_rejects_tampered_token(client, make_token):
    token = make_token("user_tamper")
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered}"})
    assert response.status_code == 401


def test_me_rejects_expired_token(client, make_token):
    token = make_token("user_expired", expired=True)
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_update_me(client, auth_user):
    headers, user = auth_user()
    response = client.patch("/api/v1/auth/me", headers=headers, json={"room_number": "B2"})
    assert response.status_code == 200
    assert response.json()["room_number"] == "B2"
    assert response.json()["full_name"] == user["full_name"]  # untouched fields survive


def test_clerk_webhook_creates_user(client, make_token):
    from svix.webhooks import Webhook
    from datetime import datetime, timezone
    import json

    wh = Webhook("whsec_dGVzdC13ZWJob29rLXNlY3JldC1rZXk=")
    payload = json.dumps(
        {
            "type": "user.created",
            "data": {
                "id": "user_webhook_1",
                "email_addresses": [{"id": "idn_1", "email_address": "webhook@hostdost.dev"}],
                "primary_email_address_id": "idn_1",
                "first_name": "Webhook",
                "last_name": "User",
            },
        }
    )
    msg_id = "msg_1"
    timestamp = datetime.now(timezone.utc)
    signature = wh.sign(msg_id=msg_id, timestamp=timestamp, data=payload)

    response = client.post(
        "/api/v1/webhooks/clerk",
        content=payload,
        headers={
            "svix-id": msg_id,
            "svix-timestamp": str(int(timestamp.timestamp())),
            "svix-signature": signature,
            "Content-Type": "application/json",
        },
    )
    assert response.status_code == 204

    # The webhook should have created the profile already, so /auth/me works
    # for this clerk id without ever calling /auth/sync.
    token = make_token("user_webhook_1")
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "webhook@hostdost.dev"
    assert me.json()["full_name"] == "Webhook User"


def test_clerk_webhook_rejects_bad_signature(client):
    response = client.post(
        "/api/v1/webhooks/clerk",
        content="{}",
        headers={
            "svix-id": "msg_bad",
            "svix-timestamp": str(int(time.time())),
            "svix-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
            "Content-Type": "application/json",
        },
    )
    assert response.status_code == 400


def test_telegram_link_flow(client, auth_user):
    headers, _ = auth_user("user_telegram_1", "telegram@hostdost.dev")

    link_response = client.post("/api/v1/auth/telegram/link-code", headers=headers)
    assert link_response.status_code == 200
    link_code = link_response.json()["link_code"]
    assert link_response.json()["deep_link"] == f"https://t.me/HostDostTestBot?start={link_code}"

    # wrong webhook secret -> rejected
    wrong = client.post(
        "/api/v1/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"},
        json={"message": {"text": f"/start {link_code}", "chat": {"id": 42}}},
    )
    assert wrong.status_code == 401

    # invalid code -> no-op, still 204
    invalid = client.post(
        "/api/v1/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": "test-telegram-webhook-secret"},
        json={"message": {"text": "/start not-a-code", "chat": {"id": 99}}},
    )
    assert invalid.status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).json()["telegram_chat_id"] is None

    # valid code -> links
    valid = client.post(
        "/api/v1/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": "test-telegram-webhook-secret"},
        json={"message": {"text": f"/start {link_code}", "chat": {"id": 42}}},
    )
    assert valid.status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).json()["telegram_chat_id"] == "42"

    # code is single-use
    replay = client.post(
        "/api/v1/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": "test-telegram-webhook-secret"},
        json={"message": {"text": f"/start {link_code}", "chat": {"id": 7777}}},
    )
    assert replay.status_code == 204
    assert client.get("/api/v1/auth/me", headers=headers).json()["telegram_chat_id"] == "42"
