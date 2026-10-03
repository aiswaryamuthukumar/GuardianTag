"""Endpoints behind the redesigned app: daily check-in, weekly summary, heatmaps,
alert timeline, device readings, and the Demo Controls."""

import time

from app.core.config import get_settings


def _pair(client, headers, uid="esp32-demo-1"):
    response = client.post("/api/v1/devices/pair", headers=headers, json={"device_uid": uid, "name": "Demo Node", "pairing_code": "1234"})
    assert response.status_code == 201
    return response.json()


def test_daily_check_once_per_day(client, auth_user):
    headers, _ = auth_user()
    before = client.get("/api/v1/gamification/daily-check", headers=headers).json()
    assert before == {"done_today": False, "streak_days": 0, "xp_reward": 10}

    done = client.post("/api/v1/gamification/daily-check", headers=headers).json()
    assert done["done_today"] is True and done["streak_days"] == 1
    client.post("/api/v1/gamification/daily-check", headers=headers)  # repeat is a no-op

    xp = client.get("/api/v1/gamification/xp", headers=headers).json()
    assert [t["reference_type"] for t in xp].count("daily_check") == 1


def test_weekly_summary_and_heatmap(client, auth_user):
    headers, _ = auth_user()
    device = _pair(client, headers)
    client.post("/api/v1/gamification/daily-check", headers=headers)
    client.post(
        "/api/v1/events", json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())}
    )

    week = client.get("/api/v1/gamification/weekly-summary", headers=headers).json()
    assert week["alerts"] == 1 and week["xp_gained"] >= 10 and week["streak_days"] == 1

    days = client.get("/api/v1/analytics/security-heatmap?days=28", headers=headers).json()
    assert len(days) == 28
    assert days[-1]["alert"] is True and days[-1]["checked"] is True
    assert not any(d["alert"] for d in days[:-1])


def test_alert_timeline_includes_names(client, auth_user):
    headers, _ = auth_user()
    device = _pair(client, headers)
    client.post(
        "/api/v1/events", json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())}
    )
    timeline = client.get("/api/v1/analytics/alert-timeline", headers=headers).json()
    assert len(timeline) == 1 and timeline[0]["device_name"] == "Demo Node" and timeline[0]["status"] == "open"


def test_heartbeat_sets_device_readings(client, auth_user):
    headers, _ = auth_user()
    device = _pair(client, headers)
    client.post("/api/v1/device-health", json={"device_uid": device["device_uid"], "status": "online", "battery_level": 80, "wifi_rssi": -60})
    fetched = client.get(f"/api/v1/devices/{device['id']}", headers=headers).json()
    assert fetched["battery_percent"] == 80
    assert fetched["signal_strength"] == 80  # (-60 + 100) * 2


def test_demo_simulate_then_disarm_goes_through_real_lifecycle(client, auth_user):
    headers, _ = auth_user()
    _pair(client, headers)

    simulated = client.post("/api/v1/demo/simulate-incident", headers=headers).json()
    assert simulated["ignored"] is False and simulated["incident"]["status"] == "open"
    events = client.get("/api/v1/events", headers=headers).json()
    assert [e["event_type"] for e in events][::-1] == ["movement", "hall_trigger", "dual_verified"]

    disarmed = client.post("/api/v1/demo/disarm", headers=headers).json()
    assert disarmed["status"] == "false_alarm"


def test_demo_respects_guardian_mode(client, auth_user):
    headers, _ = auth_user()
    device = _pair(client, headers)
    client.post("/api/v1/assets", headers=headers, json={"name": "Bag", "device_id": device["id"]})  # disarmed
    simulated = client.post("/api/v1/demo/simulate-incident", headers=headers).json()
    assert simulated == {"ignored": True, "incident": None}


def test_demo_resolve_latest_and_cycle_device(client, auth_user):
    headers, _ = auth_user()
    _pair(client, headers)
    assert client.post("/api/v1/demo/resolve-latest", headers=headers).json() is None
    client.post("/api/v1/demo/simulate-incident", headers=headers)
    assert client.post("/api/v1/demo/resolve-latest", headers=headers).json()["status"] == "resolved"

    statuses = [client.post("/api/v1/demo/cycle-device", headers=headers).json()["status"] for _ in range(3)]
    assert statuses == ["degraded", "offline", "online"]
    beat = client.post("/api/v1/demo/heartbeat", headers=headers).json()
    assert beat["signal_strength"] is not None


def test_demo_needs_a_device_and_can_be_disabled(client, auth_user, monkeypatch):
    headers, _ = auth_user()
    assert client.post("/api/v1/demo/simulate-incident", headers=headers).status_code == 400
    monkeypatch.setattr(get_settings(), "demo_tools_enabled", False)
    assert client.post("/api/v1/demo/simulate-incident", headers=headers).status_code == 404
