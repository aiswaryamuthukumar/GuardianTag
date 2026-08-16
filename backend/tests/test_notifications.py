import time


def _pair_device(client, headers, device_uid="esp32-notif-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Notif Node", "pairing_code": "555555"},
    )
    assert response.status_code == 201
    return response.json()


def test_incident_creation_generates_a_notification(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )

    notifications = client.get("/api/v1/notifications", headers=headers).json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "incident"
    assert notifications[0]["is_read"] is False


def test_mark_notification_read(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )
    notification_id = client.get("/api/v1/notifications", headers=headers).json()[0]["id"]

    response = client.patch(f"/api/v1/notifications/{notification_id}/read", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_notifications_not_visible_to_other_user(client, auth_user):
    headers_a, _ = auth_user("user_notif_a", "na@hostdost.dev")
    headers_b, _ = auth_user("user_notif_b", "nb@hostdost.dev")
    device = _pair_device(client, headers_a)
    client.post(
        "/api/v1/events",
        json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": int(time.time())},
    )

    notification_id = client.get("/api/v1/notifications", headers=headers_a).json()[0]["id"]
    response = client.patch(f"/api/v1/notifications/{notification_id}/read", headers=headers_b)
    assert response.status_code == 404
