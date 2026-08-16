def _pair_device(client, headers, device_uid="esp32-health-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Health Node", "pairing_code": "444444"},
    )
    assert response.status_code == 201
    return response.json()


def test_heartbeat_updates_device_and_is_listable(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    response = client.post(
        "/api/v1/device-health",
        json={
            "device_uid": device["device_uid"],
            "status": "online",
            "battery_level": 87,
            "wifi_rssi": -58,
            "uptime_seconds": 3600,
            "firmware_version": "1.0.0",
        },
    )
    assert response.status_code == 201
    assert response.json()["battery_level"] == 87

    history = client.get(f"/api/v1/device-health/{device['id']}", headers=headers).json()
    assert len(history) == 1

    updated_device = client.get(f"/api/v1/devices/{device['id']}", headers=headers).json()
    assert updated_device["firmware_version"] == "1.0.0"
    assert updated_device["last_seen_at"] is not None


def test_device_health_unknown_device_uid_rejected(client):
    response = client.post(
        "/api/v1/device-health", json={"device_uid": "does-not-exist", "status": "online"}
    )
    assert response.status_code == 404


def test_device_health_history_not_visible_to_other_user(client, auth_user):
    headers_a, _ = auth_user("user_health_a", "ha@hostdost.dev")
    headers_b, _ = auth_user("user_health_b", "hb@hostdost.dev")
    device = _pair_device(client, headers_a)

    response = client.get(f"/api/v1/device-health/{device['id']}", headers=headers_b)
    assert response.status_code == 404
