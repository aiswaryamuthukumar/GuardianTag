def _pair_device(client, headers, device_uid="esp32-test-1", name="Test Node"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": name, "pairing_code": "123456"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_pair_device(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)
    assert device["status"] == "online"
    assert device["device_uid"] == "esp32-test-1"


def test_pair_duplicate_device_uid_conflicts(client, auth_user):
    headers, _ = auth_user()
    _pair_device(client, headers)
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": "esp32-test-1", "name": "Other Node", "pairing_code": "000000"},
    )
    assert response.status_code == 409


def test_device_not_visible_to_other_user(client, auth_user):
    headers_a, _ = auth_user("user_dev_a", "a@hostdost.dev")
    headers_b, _ = auth_user("user_dev_b", "b@hostdost.dev")
    device = _pair_device(client, headers_a)

    response = client.get(f"/api/v1/devices/{device['id']}", headers=headers_b)
    assert response.status_code == 404


def test_asset_crud(client, auth_user):
    headers, _ = auth_user()

    create = client.post("/api/v1/assets", headers=headers, json={"name": "Backpack", "category": "bag"})
    assert create.status_code == 201
    asset = create.json()
    assert asset["is_armed"] is False

    get_response = client.get(f"/api/v1/assets/{asset['id']}", headers=headers)
    assert get_response.status_code == 200

    update = client.patch(f"/api/v1/assets/{asset['id']}", headers=headers, json={"name": "Laptop Bag"})
    assert update.status_code == 200
    assert update.json()["name"] == "Laptop Bag"

    delete = client.delete(f"/api/v1/assets/{asset['id']}", headers=headers)
    assert delete.status_code == 204

    missing = client.get(f"/api/v1/assets/{asset['id']}", headers=headers)
    assert missing.status_code == 404


def test_asset_not_visible_to_other_user(client, auth_user):
    headers_a, _ = auth_user("user_asset_a", "a2@hostdost.dev")
    headers_b, _ = auth_user("user_asset_b", "b2@hostdost.dev")

    create = client.post("/api/v1/assets", headers=headers_a, json={"name": "Bag", "category": "bag"})
    asset_id = create.json()["id"]

    response = client.get(f"/api/v1/assets/{asset_id}", headers=headers_b)
    assert response.status_code == 404


def test_arming_asset_awards_xp_once(client, auth_user):
    headers, _ = auth_user()
    create = client.post("/api/v1/assets", headers=headers, json={"name": "Bag", "category": "bag"})
    asset_id = create.json()["id"]

    first_arm = client.patch(f"/api/v1/assets/{asset_id}", headers=headers, json={"is_armed": True})
    assert first_arm.status_code == 200

    xp = client.get("/api/v1/gamification/xp", headers=headers).json()
    assert len([t for t in xp if t["reason"].startswith("Armed")]) == 1

    # re-arming an already-armed asset must not double-award
    second_arm = client.patch(f"/api/v1/assets/{asset_id}", headers=headers, json={"is_armed": True})
    assert second_arm.status_code == 200
    xp_after = client.get("/api/v1/gamification/xp", headers=headers).json()
    assert len([t for t in xp_after if t["reason"].startswith("Armed")]) == 1
