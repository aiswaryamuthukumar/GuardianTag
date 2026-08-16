import time
from datetime import datetime, timedelta, timezone


def _pair_device(client, headers, device_uid="esp32-analytics-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Analytics Node", "pairing_code": "333333"},
    )
    assert response.status_code == 201
    return response.json()


def test_summary_counts(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    client.post("/api/v1/assets", headers=headers, json={"name": "Bag", "category": "bag"})

    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )

    summary = client.get("/api/v1/analytics/summary", headers=headers).json()
    assert summary["total_devices"] == 1
    assert summary["total_assets"] == 1
    assert summary["open_incidents"] == 1
    assert summary["resolved_incidents"] == 0


def test_asset_coverage(client, auth_user):
    headers, _ = auth_user()
    create = client.post("/api/v1/assets", headers=headers, json={"name": "Bag", "category": "bag"})
    asset_id = create.json()["id"]

    before = client.get("/api/v1/analytics/asset-coverage", headers=headers).json()
    assert before == {"total_assets": 1, "armed_assets": 0, "coverage_percent": 0.0}

    client.patch(f"/api/v1/assets/{asset_id}", headers=headers, json={"is_armed": True})

    after = client.get("/api/v1/analytics/asset-coverage", headers=headers).json()
    assert after == {"total_assets": 1, "armed_assets": 1, "coverage_percent": 100.0}


def test_incidents_trend_zero_fills_gap_days(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    now = datetime.now(timezone.utc)

    def trigger(days_ago):
        ts = int((now - timedelta(days=days_ago)).timestamp())
        client.post(
            "/api/v1/events",
            json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": ts},
        )

    trigger(0)
    trigger(0)
    trigger(2)
    trigger(5)

    trend = client.get("/api/v1/analytics/incidents-trend?days=7", headers=headers).json()
    assert len(trend) == 7
    by_date = {row["date"]: row["count"] for row in trend}

    assert by_date[now.date().isoformat()] == 2
    assert by_date[(now - timedelta(days=2)).date().isoformat()] == 1
    assert by_date[(now - timedelta(days=5)).date().isoformat()] == 1
    # a day with no incidents must be zero-filled, not omitted
    assert by_date[(now - timedelta(days=1)).date().isoformat()] == 0


def test_response_times_separates_manual_and_auto_resolution(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    # manual resolution
    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )
    incident_id = client.get("/api/v1/incidents?status=open", headers=headers).json()[0]["id"]
    client.patch(f"/api/v1/incidents/{incident_id}/resolve", headers=headers, json={"status": "resolved"})

    # auto-resolution via quick disarm
    now = int(time.time())
    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": now},
    )
    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "disarmed", "device_timestamp": now + 2},
    )

    rt = client.get("/api/v1/analytics/response-times", headers=headers).json()
    assert rt["resolved_sample_size"] == 1
    assert rt["avg_resolution_seconds"] is not None
    assert rt["disarm_sample_size"] == 1
    assert rt["avg_disarm_seconds"] == rt["fastest_disarm_seconds"]
