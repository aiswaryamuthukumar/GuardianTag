import time

import pytest
from starlette.websockets import WebSocketDisconnect


def _pair_device(client, headers, device_uid="esp32-ws-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "WS Node", "pairing_code": "666666"},
    )
    assert response.status_code == 201
    return response.json()


def test_websocket_rejects_invalid_token(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/devices/{device['id']}?token=garbage"):
            pass
    assert exc_info.value.code == 4401


def test_websocket_rejects_non_owner(client, auth_user):
    headers_a, _ = auth_user("user_ws_owner", "owner@hostdost.dev")
    headers_b, _ = auth_user("user_ws_other", "other@hostdost.dev")
    device = _pair_device(client, headers_a)

    token_b = headers_b["Authorization"].split(" ", 1)[1]
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/devices/{device['id']}?token={token_b}"):
            pass
    assert exc_info.value.code == 4404


def test_websocket_broadcasts_sensor_event_and_incident_created(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"/ws/devices/{device['id']}?token={token}") as ws:
        response = client.post(
            "/api/v1/events",
            json={
                "device_uid": device["device_uid"],
                "event_type": "dual_verified",
                "device_timestamp": int(time.time()),
            },
        )
        assert response.status_code == 201

        first = ws.receive_json()
        second = ws.receive_json()

        assert first["type"] == "sensor_event"
        assert first["event"]["event_type"] == "dual_verified"
        assert second["type"] == "incident_created"
        assert second["incident"]["status"] == "open"

        # confirm it's really in Postgres, not just echoed over the socket
        incident_id = second["incident"]["id"]
        get_response = client.get(f"/api/v1/incidents/{incident_id}", headers=headers)
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "open"


def test_websocket_broadcasts_device_health(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"/ws/devices/{device['id']}?token={token}") as ws:
        response = client.post(
            "/api/v1/device-health",
            json={"device_uid": device["device_uid"], "status": "online", "battery_level": 91},
        )
        assert response.status_code == 201

        message = ws.receive_json()
        assert message["type"] == "device_health"
        assert message["health"]["battery_level"] == 91
