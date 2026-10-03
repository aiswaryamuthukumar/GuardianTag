import time


def _student(client, auth_user, sub, block, room):
    headers, user = auth_user(sub, f"{sub}@guardiantag.dev", f"Student {sub}")
    client.patch("/api/v1/auth/me", headers=headers, json={"hostel_block": block, "room_number": room})
    return headers


def _warden(client, auth_user, block=None):
    headers, user = auth_user(
        "user_warden", "warden@guardiantag.dev", "Warden W", role="warden", invite_code="test-warden-code", hostel_block=block
    )
    assert user["role"] == "warden"
    return headers


def _trigger(client, headers, uid):
    device = client.post(
        "/api/v1/devices/pair", headers=headers, json={"device_uid": uid, "name": uid, "pairing_code": "1"}
    ).json()
    client.post(
        "/api/v1/events",
        json={"device_uid": uid, "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )
    return device


def test_staff_registration_needs_invite_code(client):
    body = {"email": "fake@guardiantag.dev", "password": "longenough", "full_name": "Fake Warden", "role": "warden"}
    assert client.post("/api/v1/auth/register", json={**body, "invite_code": "nope"}).status_code == 403
    assert client.post("/api/v1/auth/register", json=body).status_code == 403


def test_students_cannot_use_warden_endpoints(client, auth_user):
    headers, _ = auth_user()
    for path in ("/api/v1/warden/incidents", "/api/v1/warden/rooms", "/api/v1/warden/analytics"):
        assert client.get(path, headers=headers).status_code == 403


def test_board_is_scoped_to_the_wardens_block(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    b = _student(client, auth_user, "stu_b", "B", "201")
    _trigger(client, a, "esp-a")
    _trigger(client, b, "esp-b")

    warden = _warden(client, auth_user, block="A")
    board = client.get("/api/v1/warden/incidents", headers=warden).json()
    assert [i["hostel_block"] for i in board] == ["A"]
    assert board[0]["room_number"] == "101"


def test_rooms_grid_shows_alert_state(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    _student(client, auth_user, "stu_c", "A", "102")
    _trigger(client, a, "esp-a")

    rooms = client.get("/api/v1/warden/rooms", headers=_warden(client, auth_user)).json()
    states = {r["room_number"]: r["state"] for r in rooms}
    assert states == {"101": "alert", "102": "idle"}


def test_warden_acknowledge_notifies_student_and_can_resolve(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    _trigger(client, a, "esp-a")
    warden = _warden(client, auth_user, block="A")
    incident_id = client.get("/api/v1/warden/incidents", headers=warden).json()[0]["id"]

    ack = client.post(f"/api/v1/incidents/{incident_id}/acknowledge", headers=warden)
    assert ack.status_code == 200 and ack.json()["status"] == "investigating"
    assert any(n["title"] == "Warden is on it" for n in client.get("/api/v1/notifications", headers=a).json())

    note = client.post(f"/api/v1/incidents/{incident_id}/notes", headers=warden, json={"note": "Checked room"})
    assert note.json()["timeline_events"][-1]["description"] == "Checked room"

    resolved = client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=warden, json={"status": "resolved"})
    assert resolved.json()["status"] == "resolved"
    # XP goes to the student, not the warden
    assert any(t["reference_type"] == "incident_resolved" for t in client.get("/api/v1/gamification/xp", headers=a).json())


def test_other_block_warden_cannot_open_incident(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    _trigger(client, a, "esp-a")
    incident_id = client.get("/api/v1/incidents", headers=a).json()[0]["id"]
    warden = _warden(client, auth_user, block="B")
    assert client.get(f"/api/v1/incidents/{incident_id}", headers=warden).status_code == 404


def test_notice_reaches_only_its_block(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    b = _student(client, auth_user, "stu_b", "B", "201")
    warden = _warden(client, auth_user)

    response = client.post(
        "/api/v1/warden/notices", headers=warden, json={"title": "Inspection", "body": "6pm", "hostel_block": "A"}
    )
    assert response.status_code == 201
    assert [n["title"] for n in client.get("/api/v1/notices", headers=a).json()] == ["Inspection"]
    assert client.get("/api/v1/notices", headers=b).json() == []
    assert client.get("/api/v1/notifications/unread-count", headers=a).json() == {"unread": 1}


def test_warden_analytics(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    _trigger(client, a, "esp-a")
    stats = client.get("/api/v1/warden/analytics", headers=_warden(client, auth_user)).json()
    assert stats["students"] == 1
    assert stats["open_incidents"] == 1
    assert stats["by_block"] == [{"hostel_block": "A", "incidents": 1}]
    assert sum(stats["by_hour"]) == 1


def test_student_can_list_their_wardens(client, auth_user):
    a = _student(client, auth_user, "stu_a", "A", "101")
    warden = _warden(client, auth_user, block="A")
    client.patch("/api/v1/auth/me", headers=warden, json={"phone": "+91 90000 00000"})
    contacts = client.get("/api/v1/auth/wardens", headers=a).json()
    assert contacts == [{"full_name": "Warden W", "phone": "+91 90000 00000", "hostel_block": "A"}]
