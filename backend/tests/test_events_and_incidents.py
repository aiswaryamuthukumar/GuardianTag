import time


def _pair_device(client, headers, device_uid="esp32-inc-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Incident Node", "pairing_code": "111111"},
    )
    assert response.status_code == 201
    return response.json()


def _post_event(client, device_uid, event_type, ts=None):
    return client.post(
        "/api/v1/events",
        json={"device_uid": device_uid, "event_type": event_type, "device_timestamp": ts or int(time.time())},
    )


def test_unknown_device_uid_rejected(client):
    response = _post_event(client, "does-not-exist", "movement")
    assert response.status_code == 404


def test_dual_verified_creates_open_incident(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    response = _post_event(client, device["device_uid"], "dual_verified")
    assert response.status_code == 201

    incidents = client.get("/api/v1/incidents", headers=headers).json()
    assert len(incidents) == 1
    assert incidents[0]["status"] == "open"
    assert incidents[0]["device_id"] == device["id"]


def test_disarmed_auto_resolves_as_false_alarm(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    now = int(time.time())
    assert _post_event(client, device["device_uid"], "dual_verified", now).status_code == 201
    assert _post_event(client, device["device_uid"], "disarmed", now + 1).status_code == 201

    incidents = client.get("/api/v1/incidents", headers=headers).json()
    assert len(incidents) == 1
    assert incidents[0]["status"] == "false_alarm"
    assert incidents[0]["resolved_at"] is not None


def test_disarmed_with_no_open_incident_is_a_noop(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    response = _post_event(client, device["device_uid"], "disarmed")
    assert response.status_code == 201  # event itself still records fine

    incidents = client.get("/api/v1/incidents", headers=headers).json()
    assert incidents == []


def test_incident_detail_includes_timeline(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified")

    incident_id = client.get("/api/v1/incidents", headers=headers).json()[0]["id"]
    detail = client.get(f"/api/v1/incidents/{incident_id}", headers=headers)
    assert detail.status_code == 200
    assert len(detail.json()["timeline_events"]) == 1
    assert detail.json()["timeline_events"][0]["actor"] == "system"


def test_manual_resolve_awards_xp_and_evaluates_achievements(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified")
    incident_id = client.get("/api/v1/incidents", headers=headers).json()[0]["id"]

    # the trigger itself must never earn XP, only the human response to it
    assert client.get("/api/v1/gamification/xp", headers=headers).json() == []

    resolve = client.patch(
        f"/api/v1/incidents/{incident_id}/resolve",
        headers=headers,
        json={"status": "resolved", "resolution_notes": "It was a false trigger from cleaning staff."},
    )
    assert resolve.status_code == 200
    assert resolve.json()["status"] == "resolved"

    xp = client.get("/api/v1/gamification/xp", headers=headers).json()
    assert any(t["reference_type"] == "incident_resolved" for t in xp)

    unlocked = client.get("/api/v1/gamification/achievements/unlocked", headers=headers).json()
    assert any(ua["achievement"]["key"] == "case_closed" for ua in unlocked)


def test_resolving_twice_does_not_double_award_xp(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified")
    incident_id = client.get("/api/v1/incidents", headers=headers).json()[0]["id"]

    client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "resolved"})
    client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "resolved"})

    xp = client.get("/api/v1/gamification/xp", headers=headers).json()
    assert len([t for t in xp if "Resolved incident" in t["reason"]]) == 1


def test_add_evidence(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified")
    incident_id = client.get("/api/v1/incidents", headers=headers).json()[0]["id"]

    response = client.post(
        f"/api/v1/incidents/{incident_id}/evidence",
        headers=headers,
        json={"type": "note", "content": "Checked the room, nothing missing."},
    )
    assert response.status_code == 201

    detail = client.get(f"/api/v1/incidents/{incident_id}", headers=headers).json()
    assert len(detail["evidence_items"]) == 1
    assert detail["evidence_items"][0]["content"] == "Checked the room, nothing missing."


def test_incident_status_filter(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    now = int(time.time())
    _post_event(client, device["device_uid"], "dual_verified", now)
    _post_event(client, device["device_uid"], "disarmed", now + 1)  # auto-resolves as false_alarm
    _post_event(client, device["device_uid"], "dual_verified", now + 100)  # stays open

    open_incidents = client.get("/api/v1/incidents?status=open", headers=headers).json()
    assert len(open_incidents) == 1

    false_alarms = client.get("/api/v1/incidents?status=false_alarm", headers=headers).json()
    assert len(false_alarms) == 1
