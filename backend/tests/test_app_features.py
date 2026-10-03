import time


def _incident(client, headers, uid="esp32-feat-1"):
    client.post("/api/v1/devices/pair", headers=headers, json={"device_uid": uid, "name": "Node", "pairing_code": "1"})
    client.post(
        "/api/v1/events", json={"device_uid": uid, "event_type": "dual_verified", "device_timestamp": int(time.time())}
    )
    return client.get("/api/v1/incidents", headers=headers).json()[0]["id"]


def test_resolve_rejects_non_closing_status(client, auth_user):
    headers, _ = auth_user()
    incident_id = _incident(client, headers)
    response = client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "open"})
    assert response.status_code == 422


def test_resolve_and_evidence_write_timeline(client, auth_user):
    headers, _ = auth_user()
    incident_id = _incident(client, headers)
    client.post(f"/api/v1/incidents/{incident_id}/evidence", headers=headers, json={"type": "note", "content": "ok"})
    client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "false_alarm"})

    types = [t["event_type"] for t in client.get(f"/api/v1/incidents/{incident_id}", headers=headers).json()["timeline_events"]]
    assert types == ["incident_created", "evidence_added", "false_alarm"]


def test_active_filter(client, auth_user):
    headers, _ = auth_user()
    incident_id = _incident(client, headers)
    assert len(client.get("/api/v1/incidents?active=true", headers=headers).json()) == 1
    client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "resolved"})
    assert client.get("/api/v1/incidents?active=true", headers=headers).json() == []


def test_unread_count_and_read_all(client, auth_user):
    headers, _ = auth_user()
    _incident(client, headers)
    assert client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread"] == 1
    client.patch("/api/v1/notifications/read-all", headers=headers)
    assert client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread"] == 0


def test_profile_preferences_validation(client, auth_user):
    headers, _ = auth_user()
    ok = client.patch("/api/v1/auth/me", headers=headers, json={"quiet_start": "23:00", "quiet_end": "07:00"})
    assert ok.status_code == 200 and ok.json()["quiet_start"] == "23:00"
    assert client.patch("/api/v1/auth/me", headers=headers, json={"quiet_start": "25:00"}).status_code == 422


def test_progress_tracks_challenges(client, auth_user):
    headers, _ = auth_user()
    asset = client.post("/api/v1/assets", headers=headers, json={"name": "Bag"}).json()
    client.patch(f"/api/v1/assets/{asset['id']}", headers=headers, json={"is_armed": True})

    progress = {p["key"]: p for p in client.get("/api/v1/gamification/progress", headers=headers).json()}
    assert progress["arm_3_assets"]["progress"] == 1
    assert progress["arm_3_assets"]["target"] == 3
    assert progress["first_guardian"]["completed"] is True

    level = client.get("/api/v1/gamification/level", headers=headers).json()
    assert level["next_level"] == "watchman"
    assert level["next_level_at"] == 100


def test_heatmap_and_event_mix(client, auth_user):
    headers, _ = auth_user()
    _incident(client, headers)
    heat = client.get("/api/v1/analytics/heatmap", headers=headers).json()
    assert sum(map(sum, heat["cells"])) == 1
    assert heat["peak_hour"] is not None
    mix = client.get("/api/v1/analytics/event-mix", headers=headers).json()
    assert mix == [{"event_type": "dual_verified", "count": 1}]


def test_upload_image_and_serve_it(client, auth_user):
    headers, _ = auth_user()
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    response = client.post("/api/v1/uploads", headers=headers, files={"file": ("a.png", png, "image/png")})
    assert response.status_code == 201
    assert client.get(response.json()["url"]).content == png

    rejected = client.post("/api/v1/uploads", headers=headers, files={"file": ("a.txt", b"hi", "text/plain")})
    assert rejected.status_code == 415
