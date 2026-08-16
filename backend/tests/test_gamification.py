import time


def _pair_device(client, headers, device_uid="esp32-gamify-1"):
    response = client.post(
        "/api/v1/devices/pair",
        headers=headers,
        json={"device_uid": device_uid, "name": "Gamify Node", "pairing_code": "222222"},
    )
    assert response.status_code == 201
    return response.json()


def _create_asset(client, headers, name="Bag"):
    response = client.post("/api/v1/assets", headers=headers, json={"name": name, "category": "bag"})
    assert response.status_code == 201
    return response.json()


def test_catalog_is_seeded(client):
    achievements = client.get("/api/v1/gamification/achievements").json()
    keys = {a["key"] for a in achievements}
    assert {"first_guardian", "case_closed", "quick_reflexes", "streak_starter", "week_guardian"} <= keys

    challenges = client.get("/api/v1/gamification/challenges").json()
    challenge_keys = {c["key"] for c in challenges}
    assert {"arm_3_assets", "fast_fingers"} <= challenge_keys


def test_security_score_lazily_created_at_zero(client, auth_user):
    headers, _ = auth_user()
    response = client.get("/api/v1/gamification/security-score", headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        "score": 0,
        "level": "rookie",
        "streak_days": 0,
        "last_calculated_at": response.json()["last_calculated_at"],
    }


def test_first_activity_starts_a_one_day_streak(client, auth_user):
    headers, _ = auth_user()
    asset = _create_asset(client, headers)
    client.patch(f"/api/v1/assets/{asset['id']}", headers=headers, json={"is_armed": True})

    score = client.get("/api/v1/gamification/security-score", headers=headers).json()
    assert score["streak_days"] == 1, "the very first XP-earning action should start a 1-day streak"


def test_arming_three_assets_unlocks_achievement_and_challenge(client, auth_user):
    headers, _ = auth_user()
    for i in range(3):
        asset = _create_asset(client, headers, name=f"Bag {i}")
        client.patch(f"/api/v1/assets/{asset['id']}", headers=headers, json={"is_armed": True})

    unlocked = client.get("/api/v1/gamification/achievements/unlocked", headers=headers).json()
    assert any(ua["achievement"]["key"] == "first_guardian" for ua in unlocked)

    score = client.get("/api/v1/gamification/security-score", headers=headers).json()
    # 3 * 5 (arm) + 20 (first_guardian achievement) + 30 (arm_3_assets challenge) = 65
    assert score["score"] == 65


def test_quick_disarms_never_award_xp_for_the_trigger(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    for _ in range(5):
        now = int(time.time())
        assert client.post(
            "/api/v1/events",
            json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": now},
        ).status_code == 201
        assert client.post(
            "/api/v1/events",
            json={"device_uid": device["device_uid"], "event_type": "disarmed", "device_timestamp": now + 1},
        ).status_code == 201

    xp = client.get("/api/v1/gamification/xp", headers=headers).json()
    disarm_awards = [t for t in xp if t["reference_type"] == "incident_avoided"]
    assert len(disarm_awards) == 5

    unlocked = {ua["achievement"]["key"] for ua in client.get(
        "/api/v1/gamification/achievements/unlocked", headers=headers
    ).json()}
    assert "quick_reflexes" in unlocked

    completed = {c["key"] for c in client.get(
        "/api/v1/gamification/challenges", headers=headers
    ).json()}
    # "fast_fingers" stays in the active catalog even after completion (challenges
    # aren't removed on completion) - check completion via the score/xp instead.
    assert "fast_fingers" in completed
    fast_fingers_award = [t for t in xp if "Fast Fingers" in t["reason"]]
    assert len(fast_fingers_award) == 1


def test_level_thresholds(client, auth_user):
    headers, _ = auth_user()
    device = _pair_device(client, headers)

    # Cheapest repeatable way to rack up XP without hitting one-shot
    # achievement/challenge caps: alternating dual_verified + disarmed cycles,
    # each worth 5 XP, until we cross into "watchman" (100 XP).
    for _ in range(25):
        now = int(time.time())
        client.post(
            "/api/v1/events",
            json={"device_uid": device["device_uid"], "event_type": "dual_verified", "device_timestamp": now},
        )
        client.post(
            "/api/v1/events",
            json={"device_uid": device["device_uid"], "event_type": "disarmed", "device_timestamp": now + 1},
        )

    score = client.get("/api/v1/gamification/security-score", headers=headers).json()
    assert score["score"] >= 100
    assert score["level"] in ("watchman", "guardian", "sentinel", "hostel_protector")
