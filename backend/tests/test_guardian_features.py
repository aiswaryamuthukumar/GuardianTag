"""Backend-side features that stand in for what the firmware can't do:
software arming gate, clock-skew tolerance, escalation, offline detection,
auto-arm schedules, and the per-user WebSocket."""

import time
from datetime import datetime, time as dtime, timedelta, timezone
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from app.services.monitor import run_cycle
from app.services.schedules import window_active


def _pair_device(client, headers, device_uid="esp32-guard-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Guard Node", "pairing_code": "222222"},
    )
    assert response.status_code == 201
    return response.json()


def _post_event(client, device_uid, event_type, ts=None):
    return client.post(
        "/api/v1/events",
        json={"device_uid": device_uid, "event_type": event_type, "device_timestamp": ts or int(time.time())},
    )


def _asset(client, headers, device_id, armed):
    asset = client.post(
        "/api/v1/assets", headers=headers, json={"name": "Trunk", "category": "bag", "device_id": device_id}
    ).json()
    if armed:
        client.patch(f"/api/v1/assets/{asset['id']}", headers=headers, json={"is_armed": True})
    return asset


# --- arming gate -----------------------------------------------------------


def test_trigger_ignored_when_linked_assets_disarmed(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _asset(client, headers, device["id"], armed=False)

    response = _post_event(client, device["device_uid"], "dual_verified")
    assert response.status_code == 201
    assert response.json()["payload"]["ignored"] == "disarmed"
    assert client.get("/api/v1/incidents", headers=headers).json() == []


def test_trigger_raises_incident_for_armed_asset(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    asset = _asset(client, headers, device["id"], armed=True)

    _post_event(client, device["device_uid"], "dual_verified")
    incidents = client.get("/api/v1/incidents", headers=headers).json()
    assert len(incidents) == 1
    assert incidents[0]["asset_id"] == asset["id"]
    assert "Trunk" in incidents[0]["title"]


def test_arm_all_toggles_every_asset(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _asset(client, headers, device["id"], armed=False)
    _asset(client, headers, device["id"], armed=False)

    armed = client.post("/api/v1/assets/arm-all", headers=headers, json={"armed": True}).json()
    assert all(a["is_armed"] for a in armed)
    coverage = client.get("/api/v1/analytics/asset-coverage", headers=headers).json()
    assert coverage["coverage_percent"] == 100.0


def test_cannot_link_asset_to_someone_elses_device(client, auth_user):
    headers_a, _ = auth_user("user_a", "a@guardiantag.dev")
    headers_b, _ = auth_user("user_b", "b@guardiantag.dev")
    device = _pair_device(client, headers_a)
    response = client.post("/api/v1/assets", headers=headers_b, json={"name": "X", "device_id": device["id"]})
    assert response.status_code == 404


# --- clock skew -------------------------------------------------------------


def test_future_device_clock_falls_back_to_server_time(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    ist_as_utc = int(time.time()) + 5 * 3600 + 1800  # compile-time IST read as UTC

    response = _post_event(client, device["device_uid"], "movement", ist_as_utc)
    assert response.status_code == 201
    body = response.json()
    assert body["payload"]["clock_skew_seconds"] > 5 * 3600
    received = datetime.fromisoformat(body["received_at"])
    assert abs(datetime.fromisoformat(body["device_timestamp"]) - received) < timedelta(seconds=1)


# --- escalation / offline ----------------------------------------------------


def test_unanswered_incident_escalates_and_alerts_warden(client, auth_user):
    headers, _ = auth_user()
    client.patch("/api/v1/auth/me", headers=headers, json={"hostel_block": "A", "room_number": "101"})
    warden_headers, _ = auth_user(
        "user_warden", "warden@guardiantag.dev", "Warden W", role="warden", invite_code="test-warden-code", hostel_block="A"
    )
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified", int(time.time()) - 120)

    assert run_cycle()["escalated"] == 1
    incident = client.get("/api/v1/incidents", headers=headers).json()[0]
    assert incident["severity"] == "high"

    warden_inbox = client.get("/api/v1/notifications", headers=warden_headers).json()
    assert any("room 101" in n["title"] for n in warden_inbox)
    assert run_cycle()["escalated"] == 0  # only once


def test_acknowledged_incident_does_not_escalate(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    _post_event(client, device["device_uid"], "dual_verified", int(time.time()) - 120)
    incident_id = client.get("/api/v1/incidents", headers=headers).json()[0]["id"]

    ack = client.post(f"/api/v1/incidents/{incident_id}/acknowledge", headers=headers)
    assert ack.json()["status"] == "investigating"
    assert run_cycle()["escalated"] == 0


def test_silent_device_goes_offline_and_heartbeat_brings_it_back(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    assert run_cycle(datetime.now(timezone.utc) + timedelta(minutes=4))["offline"] == 1
    assert client.get(f"/api/v1/devices/{device['id']}", headers=headers).json()["status"] == "offline"
    inbox = client.get("/api/v1/notifications", headers=headers).json()
    assert inbox[0]["type"] == "device_health"

    client.post("/api/v1/device-health", json={"device_uid": device["device_uid"], "status": "online"})
    assert client.get(f"/api/v1/devices/{device['id']}", headers=headers).json()["status"] == "online"


# --- schedules ----------------------------------------------------------------


def _sched(start, end, mask=0b1111111):
    return SimpleNamespace(start_time=start, end_time=end, days_mask=mask)


def test_window_active_same_day_and_overnight():
    monday_10 = datetime(2026, 9, 28, 10, 0)
    assert window_active(_sched(dtime(9), dtime(17)), monday_10)
    assert not window_active(_sched(dtime(9), dtime(17), mask=0b0000010), monday_10)  # Tuesdays only

    overnight = _sched(dtime(23), dtime(7), mask=0b0000001)  # starts Monday night
    assert window_active(overnight, datetime(2026, 9, 28, 23, 30))
    assert window_active(overnight, datetime(2026, 9, 29, 6, 0))  # Tuesday early morning
    assert not window_active(overnight, datetime(2026, 9, 29, 23, 30))


def test_schedule_arms_and_disarms_asset(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    asset = _asset(client, headers, device["id"], armed=False)
    tz = ZoneInfo("Asia/Kolkata")
    start = datetime.now(tz).replace(second=0, microsecond=0) - timedelta(minutes=1)
    end = start + timedelta(minutes=30)

    created = client.post(
        "/api/v1/schedules",
        headers=headers,
        json={
            "asset_id": asset["id"],
            "days_mask": 127,
            "start_time": start.strftime("%H:%M"),
            "end_time": end.strftime("%H:%M"),
        },
    )
    assert created.status_code == 201

    run_cycle()
    assert client.get(f"/api/v1/assets/{asset['id']}", headers=headers).json()["is_armed"] is True

    run_cycle(datetime.now(timezone.utc) + timedelta(hours=1))
    assert client.get(f"/api/v1/assets/{asset['id']}", headers=headers).json()["is_armed"] is False


# --- realtime ----------------------------------------------------------------------


def test_user_socket_receives_events_notifications_and_incidents(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"/ws/me?token={token}") as ws:
        _post_event(client, device["device_uid"], "dual_verified")
        types = [ws.receive_json()["type"] for _ in range(3)]
    assert types == ["sensor_event", "notification", "incident_created"]
