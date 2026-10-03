import uuid

from sqlalchemy import create_engine, text

STUDENT = {"email": "Asha@Hostel.dev", "password": "correct-horse-battery", "full_name": "Asha K", "role": "student"}


def test_register_student_returns_token_and_profile(client):
    response = client.post("/api/v1/auth/register", json={**STUDENT, "hostel_block": "a", "room_number": "101"})
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer" and body["access_token"]
    assert body["user"]["email"] == "asha@hostel.dev"  # normalised
    assert body["user"]["role"] == "student"
    assert body["user"]["hostel_block"] == "A"
    assert "password_hash" not in body["user"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200 and me.json()["full_name"] == "Asha K"


def test_password_is_stored_hashed(client):
    import os

    client.post("/api/v1/auth/register", json=STUDENT)
    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.connect() as conn:
        stored = conn.execute(text("SELECT password_hash FROM users WHERE email = 'asha@hostel.dev'")).scalar()
    assert stored.startswith("$2b$") and STUDENT["password"] not in stored


def test_duplicate_email_rejected(client):
    assert client.post("/api/v1/auth/register", json=STUDENT).status_code == 201
    assert client.post("/api/v1/auth/register", json={**STUDENT, "email": "asha@hostel.dev"}).status_code == 409


def test_register_validation(client):
    assert client.post("/api/v1/auth/register", json={**STUDENT, "password": "short"}).status_code == 422
    assert client.post("/api/v1/auth/register", json={**STUDENT, "email": "not-an-email"}).status_code == 422


def test_login_with_correct_and_wrong_password(client):
    client.post("/api/v1/auth/register", json=STUDENT)
    ok = client.post("/api/v1/auth/login", json={"email": "ASHA@hostel.dev", "password": STUDENT["password"], "role": "student"})
    assert ok.status_code == 200 and ok.json()["user"]["email"] == "asha@hostel.dev"

    wrong = client.post("/api/v1/auth/login", json={"email": STUDENT["email"], "password": "nope-nope", "role": "student"})
    unknown = client.post("/api/v1/auth/login", json={"email": "ghost@hostel.dev", "password": "whatever1", "role": "student"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["detail"] == unknown.json()["detail"]  # no email probing


def test_login_is_role_based(client):
    client.post("/api/v1/auth/register", json=STUDENT)
    client.post(
        "/api/v1/auth/register",
        json={"email": "warden@hostel.dev", "password": "warden-pass-1", "full_name": "Warden W", "role": "warden", "invite_code": "test-warden-code"},
    )

    student_on_staff_tab = client.post("/api/v1/auth/login", json={**STUDENT, "role": "warden"})
    assert student_on_staff_tab.status_code == 403
    assert "Student tab" in student_on_staff_tab.json()["detail"]

    staff = client.post("/api/v1/auth/login", json={"email": "warden@hostel.dev", "password": "warden-pass-1", "role": "warden"})
    assert staff.status_code == 200 and staff.json()["user"]["role"] == "warden"
    staff_on_student_tab = client.post("/api/v1/auth/login", json={"email": "warden@hostel.dev", "password": "warden-pass-1", "role": "student"})
    assert staff_on_student_tab.status_code == 403


def test_change_password(client, auth_user):
    headers, user = auth_user()
    bad = client.post("/api/v1/auth/change-password", headers=headers, json={"current_password": "wrong", "new_password": "brand-new-pass"})
    assert bad.status_code == 400
    ok = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "correct-horse-battery", "new_password": "brand-new-pass"},
    )
    assert ok.status_code == 204
    login = client.post("/api/v1/auth/login", json={"email": user["email"], "password": "brand-new-pass", "role": "student"})
    assert login.status_code == 200


def test_me_requires_auth(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_rejects_tampered_token(client, auth_user):
    headers, _ = auth_user()
    token = headers["Authorization"].split(" ", 1)[1]
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered}"}).status_code == 401


def test_me_rejects_expired_token(client, auth_user, make_token):
    _, user = auth_user()
    token = make_token(user["id"], expired=True)
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_for_deleted_user_rejected(client, make_token):
    token = make_token(str(uuid.uuid4()))
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_update_me(client, auth_user):
    headers, user = auth_user()
    response = client.patch("/api/v1/auth/me", headers=headers, json={"room_number": "B2"})
    assert response.status_code == 200
    assert response.json()["room_number"] == "B2"
    assert response.json()["full_name"] == user["full_name"]  # untouched fields survive


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
