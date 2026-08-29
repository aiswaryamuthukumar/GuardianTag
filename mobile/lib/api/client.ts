export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let mockDevicesList = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "My Backpack",
    device_uid: "esp32-001",
    status: "online",
    battery_percent: 85,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Hostel Locker",
    device_uid: "esp32-002",
    status: "online",
    battery_percent: 60,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

let mockIncidentsList = [
  {
    id: "660e8400-e29b-41d4-a716-446655440000",
    device_id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Unverified movement detected",
    description: "Both motion and hall sensors triggered",
    status: "open",
    triggered_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    resolved_at: null,
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    device_id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Locker opened unexpectedly",
    description: "Hall sensor detected opening",
    status: "false_alarm",
    triggered_at: new Date(Date.now() - 60 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    resolved_at: new Date(Date.now() - 50 * 60000).toISOString(),
  },
];

const mockAssets = [
  {
    id: "770e8400-e29b-41d4-a716-446655440000",
    device_id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Laptop",
    description: "MacBook Pro 16-inch",
    created_at: new Date().toISOString(),
  },
];

const mockSecurityScore = {
  score: 78,
  level: "Guardian",
  total_xp: 450,
  next_level_xp: 500,
};

const mockAchievements = [
  {
    id: "1",
    name: "First Device",
    description: "Paired your first device",
    icon: "🎯",
    unlocked: true,
  },
];

const mockChallenges = [
  {
    id: "1",
    title: "Daily Guardian",
    description: "Keep all devices armed",
    progress: 18,
    goal: 24,
    reward: 50,
    active: true,
  },
];

const mockChartData = [
  { date: "Mon", incidents: 2 },
  { date: "Tue", incidents: 1 },
  { date: "Wed", incidents: 3 },
  { date: "Thu", incidents: 0 },
  { date: "Fri", incidents: 2 },
  { date: "Sat", incidents: 1 },
  { date: "Sun", incidents: 3 },
];

const mockAnalytics = {
  total_incidents: 12,
  false_alarms: 3,
  true_positives: 9,
  avg_response_time: 45,
  devices_online: 2,
  devices_offline: 0,
  chart_data: mockChartData,
};

export const apiClient = {
  get: async <T,>(path: string, token?: string): Promise<T> => {
    await delay(300);
    
    if (path.includes("/devices")) return mockDevicesList as T;
    if (path.includes("/incidents/") && path.includes("[id]")) return mockIncidentsList[0] as T;
    if (path.includes("/incidents")) return mockIncidentsList as T;
    if (path.includes("/assets")) return mockAssets as T;
    if (path.includes("/analytics")) return mockAnalytics as T;
    if (path.includes("/security-score")) return mockSecurityScore as T;
    if (path.includes("/achievements")) return mockAchievements as T;
    if (path.includes("/challenges")) return mockChallenges as T;
    
    return [] as T;
  },

  post: async <T,>(path: string, body?: unknown, token?: string): Promise<T> => {
    await delay(300);
    
    if (path.includes("/devices")) {
      const newDevice = {
        id: Math.random().toString(),
        name: (body as any).name || "New Device",
        device_uid: (body as any).device_uid,
        status: "online",
        battery_percent: 100,
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockDevicesList.push(newDevice);
      return newDevice as T;
    }
    
    return { success: true } as T;
  },

  patch: async <T,>(path: string, body?: unknown, token?: string): Promise<T> => {
    await delay(300);
    return { success: true } as T;
  },

  delete: async <T,>(path: string, token?: string): Promise<T> => {
    await delay(300);
    return { success: true } as T;
  },
};
// export class ApiError extends Error {
//   constructor(
//     message: string,
//     public status: number,
//   ) {
//     super(message);
//     this.name = "ApiError";
//   }
// }

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// let mockDevices = [
//   {
//     id: "550e8400-e29b-41d4-a716-446655440000",
//     name: "My Backpack",
//     device_uid: "esp32-001",
//     status: "online",
//     battery_percent: 85,
//     last_seen_at: new Date().toISOString(),
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "550e8400-e29b-41d4-a716-446655440001",
//     name: "Hostel Locker",
//     device_uid: "esp32-002",
//     status: "online",
//     battery_percent: 60,
//     last_seen_at: new Date().toISOString(),
//     created_at: new Date().toISOString(),
//   },
// ];

// const mockIncidents = [
//   {
//     id: "660e8400-e29b-41d4-a716-446655440000",
//     device_id: "550e8400-e29b-41d4-a716-446655440000",
//     title: "Unverified movement detected",
//     description: "Both motion and hall sensors triggered",
//     status: "open",
//     triggered_at: new Date(Date.now() - 5 * 60000).toISOString(),
//     created_at: new Date(Date.now() - 5 * 60000).toISOString(),
//     resolved_at: null,
//   },
//   {
//     id: "660e8400-e29b-41d4-a716-446655440001",
//     device_id: "550e8400-e29b-41d4-a716-446655440001",
//     title: "Locker opened unexpectedly",
//     description: "Hall sensor detected opening",
//     status: "false_alarm",
//     triggered_at: new Date(Date.now() - 60 * 60000).toISOString(),
//     created_at: new Date(Date.now() - 60 * 60000).toISOString(),
//     resolved_at: new Date(Date.now() - 50 * 60000).toISOString(),
//   },
// ];

// const mockAssets = [
//   {
//     id: "770e8400-e29b-41d4-a716-446655440000",
//     device_id: "550e8400-e29b-41d4-a716-446655440000",
//     name: "Laptop",
//     description: "MacBook Pro 16-inch",
//     created_at: new Date().toISOString(),
//   },
//   {
//     id: "770e8400-e29b-41d4-a716-446655440001",
//     device_id: "550e8400-e29b-41d4-a716-446655440000",
//     name: "Camera",
//     description: "Sony A7IV",
//     created_at: new Date().toISOString(),
//   },
// ];

// const mockAnalytics = {
//   total_incidents: 12,
//   false_alarms: 3,
//   true_positives: 9,
//   avg_response_time: 45,
//   devices_online: 2,
//   devices_offline: 0,
// };

// const mockSecurityScore = {
//   score: 78,
//   level: "Guardian",
//   total_xp: 450,
//   next_level_xp: 500,
// };

// const mockAchievements = [
//   {
//     id: "1",
//     name: "First Device",
//     description: "Paired your first device",
//     icon: "🎯",
//     unlocked: true,
//     unlockedAt: new Date().toISOString(),
//   },
//   {
//     id: "2",
//     name: "Quick Reflexes",
//     description: "Disarmed an alert in under 5 seconds",
//     icon: "⚡",
//     unlocked: true,
//     unlockedAt: new Date().toISOString(),
//   },
//   {
//     id: "3",
//     name: "Perfect Guardian",
//     description: "Zero false alarms",
//     icon: "👑",
//     unlocked: false,
//   },
// ];

// const mockChallenges = [
//   {
//     id: "1",
//     title: "Daily Guardian",
//     description: "Keep all devices armed for 24 hours",
//     progress: 18,
//     goal: 24,
//     reward: 50,
//     active: true,
//   },
//   {
//     id: "2",
//     title: "Fast Response",
//     description: "Disarm 3 alerts today",
//     progress: 1,
//     goal: 3,
//     reward: 100,
//     active: true,
//   },
// ];
// const mockXPData = {
//   currentLevel: 3,
//   currentXP: 450,
//   nextLevelXP: 500,
//   totalXP: 1250,
//   levelName: "Guardian",
//   progressPercent: 90,
//   xpBreakdown: [
//     { activity: "Device Pairing", xp: 50 },
//     { activity: "Quick Disarm", xp: 200 },
//     { activity: "Incident Resolution", xp: 300 },
//     { activity: "Daily Streak", xp: 700 },
//   ],
// };

// export const apiClient = {
//   get: async <T,>(path: string, token?: string): Promise<T> => {
//     await delay(300);

//     if (path.includes("/devices")) return mockDevices as T;
//     if (path.includes("/incidents") && !path.includes("[id]")){
//       return mockIncidents[0] as T;
//     }
//     if (path.includes("/assets")) return mockAssets as T;
//     if (path.includes("/analytics/summary")) return mockAnalytics as T;
//     if (path.includes("/security-score")) return mockSecurityScore as T;
//     if (path.includes("/achievements")) return mockAchievements as T;
//     if (path.includes("/challenges")) return mockChallenges as T;
//     if (path.includes("/xp") || path.includes("/gamification")) return mockXPData as T;

//     return {} as T;
//   },

//   post: async <T,>(path: string, body?: unknown, token?: string): Promise<T> => {
//     await delay(300);

//     // Handle device creation
//     if (path.includes("/devices") && !path.includes("health")) {
//       const newDevice = {
//         id: Math.random().toString(),
//         name: (body as any).name,
//         device_uid: (body as any).device_uid,
//         status: "online",
//         battery_percent: 100,
//         last_seen_at: new Date().toISOString(),
//         created_at: new Date().toISOString(),
//       };
//       mockDevices.push(newDevice);
//       return newDevice as T;
//     }

//     return { success: true } as T;
//   },

//   patch: async <T,>(path: string, body?: unknown, token?: string): Promise<T> => {
//     await delay(300);
//     return { success: true } as T;
//   },

//   delete: async <T,>(path: string, token?: string): Promise<T> => {
//     await delay(300);
//     return { success: true } as T;
//   },
// };

// // const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// // export class ApiError extends Error {
// //   constructor(
// //     message: string,
// //     public status: number,
// //   ) {
// //     super(message);
// //     this.name = "ApiError";
// //   }
// // }

// // type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

// // async function request<T>(path: string, options: RequestOptions = {}, token?: string): Promise<T> {
// //   try {
// //     const controller = new AbortController();
// //     const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

// //     const res = await fetch(`${API_URL}${path}`, {
// //       ...options,
// //       signal: controller.signal,
// //       headers: {
// //         "Content-Type": "application/json",
// //         ...(token ? { Authorization: `Bearer ${token}` } : {}),
// //         ...options.headers,
// //       },
// //       body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
// //     });

// //     clearTimeout(timeoutId);

// //     if (!res.ok) {
// //       let errorText = res.statusText;
// //       try {
// //         errorText = await res.text();
// //       } catch (e) {
// //         // Response is unreadable - use statusText
// //       }
// //       throw new ApiError(errorText || res.statusText, res.status);
// //     }

// //     if (res.status === 204) return undefined as T;

// //     let text = "";
// //     try {
// //       text = await res.text();
// //     } catch (e) {
// //       throw new ApiError("Failed to read response", res.status);
// //     }

// //     if (!text) return undefined as T;

// //     try {
// //       return JSON.parse(text) as T;
// //     } catch (e) {
// //       throw new ApiError("Failed to parse JSON response", res.status);
// //     }
// //   } catch (error) {
// //     // Handle different error types
// //     if (error instanceof ApiError) {
// //       throw error;
// //     }

// //     if (error instanceof TypeError) {
// //       // Network error or fetch failed
// //       if (error.message.includes("abort")) {
// //         throw new ApiError("Request timeout - check your connection", 0);
// //       }
// //       throw new ApiError("Network error - check your internet connection", 0);
// //     }

// //     if (error instanceof SyntaxError) {
// //       throw new ApiError("Invalid server response", 0);
// //     }

// //     // Unknown error
// //     throw new ApiError((error as Error).message || "Unknown error", 0);
// //   }
// // }

// // export const apiClient = {
// //   get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
// //   post: <T>(path: string, body?: unknown, token?: string) =>
// //     request<T>(path, { method: "POST", body }, token),
// //   patch: <T>(path: string, body?: unknown, token?: string) =>
// //     request<T>(path, { method: "PATCH", body }, token),
// //   delete: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE" }, token),
// // };