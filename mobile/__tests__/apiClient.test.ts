import { apiClient, ApiError } from "@/src/lib/api/client";

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown>; text?: () => Promise<string> }) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
    ...response,
  }) as unknown as typeof fetch;
}

describe("apiClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("attaches the bearer token and JSON content type", async () => {
    mockFetchOnce({ json: async () => ({ ok: true }) });

    await apiClient.get("/devices", "test-token");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/devices"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("omits the Authorization header when no token is given", async () => {
    mockFetchOnce({ json: async () => ({}) });

    await apiClient.get("/health");

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("JSON-serializes the body for POST/PATCH", async () => {
    mockFetchOnce({ json: async () => ({}) });

    await apiClient.post("/assets", { name: "Bag", category: "bag" });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.body).toBe(JSON.stringify({ name: "Bag", category: "bag" }));
  });

  it("returns undefined for a 204 No Content response instead of parsing JSON", async () => {
    mockFetchOnce({
      status: 204,
      json: async () => {
        throw new Error("must not be called for 204");
      },
    });

    const result = await apiClient.delete("/assets/123");
    expect(result).toBeUndefined();
  });

  it("throws ApiError with the response status and body text on failure", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Asset not found",
    });

    await expect(apiClient.get("/assets/missing")).rejects.toMatchObject({
      status: 404,
      message: "Asset not found",
    });
    await expect(apiClient.get("/assets/missing")).rejects.toBeInstanceOf(ApiError);
  });
});
