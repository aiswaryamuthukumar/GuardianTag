def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_lan_web_preview_in_development(client):
    """The Expo web preview is opened via the PC's changing LAN/hotspot IP."""
    for origin in ("http://10.180.201.178:8081", "http://192.168.1.10:8081", "http://localhost:8081"):
        response = client.options(
            "/api/v1/auth/register",
            headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
        )
        assert response.status_code == 200, origin
        assert response.headers["access-control-allow-origin"] == origin

    blocked = client.options(
        "/api/v1/auth/register",
        headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "POST"},
    )
    assert blocked.status_code == 400
