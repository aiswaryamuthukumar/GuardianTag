"""Pretend to be a GuardianTag ESP32, for demos and testing without the hardware.

Speaks exactly what the firmware speaks (POST /events and /device-health),
so the app reacts the same way it would to the real device.

  python scripts/simulate_device.py --uid guardiantag-01 heartbeat      # 60s heartbeats until Ctrl+C
  python scripts/simulate_device.py --uid guardiantag-01 trigger        # dual-verified alarm -> Emergency screen
  python scripts/simulate_device.py --uid guardiantag-01 trigger --disarm-after 2   # ...cancelled on the device
  python scripts/simulate_device.py --uid guardiantag-01 noise          # single-sensor events that must NOT alarm
  python scripts/simulate_device.py --uid guardiantag-01 demo           # all of the above, narrated

Pair the UID in the app first (Devices -> Pair a new device).
"""

import argparse
import random
import sys
import time

import httpx


def post(client: httpx.Client, path: str, body: dict) -> None:
    response = client.post(path, json=body)
    status = "ok" if response.is_success else f"HTTP {response.status_code}: {response.text[:120]}"
    print(f"  -> {path} {body.get('event_type', body.get('status', ''))}: {status}")
    if response.status_code == 404:
        sys.exit("Unknown device_uid. Pair it in the app first.")


def event(client: httpx.Client, uid: str, event_type: str) -> None:
    post(client, "/events", {"device_uid": uid, "event_type": event_type, "device_timestamp": int(time.time())})


def heartbeat(client: httpx.Client, uid: str, started: float) -> None:
    post(
        client,
        "/device-health",
        {
            "device_uid": uid,
            "status": "online",
            "wifi_rssi": random.randint(-72, -48),
            "uptime_seconds": int(time.time() - started),
            "firmware_version": "1.0.0-sim",
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("scenario", choices=["heartbeat", "trigger", "noise", "demo"])
    parser.add_argument("--uid", required=True, help="DEVICE_UID the unit was paired with")
    parser.add_argument("--api", default="http://localhost:8000/api/v1")
    parser.add_argument("--interval", type=int, default=60, help="heartbeat period in seconds")
    parser.add_argument("--disarm-after", type=float, default=None, help="send 'disarmed' this many seconds after a trigger")
    args = parser.parse_args()
    started = time.time()

    with httpx.Client(base_url=args.api, timeout=10) as client:
        if args.scenario == "heartbeat":
            print(f"Heartbeat every {args.interval}s. Ctrl+C to stop (the app marks it offline ~3 min later).")
            while True:
                heartbeat(client, args.uid, started)
                time.sleep(args.interval)

        if args.scenario in ("noise", "demo"):
            print("Single-sensor noise: movement and opening separately (dual verification filters these).")
            event(client, args.uid, "movement")
            time.sleep(1)
            event(client, args.uid, "hall_trigger")
            time.sleep(2)

        if args.scenario == "demo":
            print("Heartbeat so the device shows online with a signal reading.")
            heartbeat(client, args.uid, started)
            time.sleep(2)
            print("Trigger, cancelled on the device within the 3s window -> auto false alarm, +5 XP.")
            event(client, args.uid, "movement")
            event(client, args.uid, "hall_trigger")
            event(client, args.uid, "dual_verified")
            time.sleep(2)
            event(client, args.uid, "disarmed")
            time.sleep(4)

        if args.scenario in ("trigger", "demo"):
            print("Real trigger: motion + opening together -> incident + Emergency screen.")
            event(client, args.uid, "movement")
            event(client, args.uid, "hall_trigger")
            event(client, args.uid, "dual_verified")
            if args.disarm_after is not None:
                time.sleep(args.disarm_after)
                event(client, args.uid, "disarmed")
            elif args.scenario == "demo":
                print("Left unanswered: after ~30s the backend escalates it to HIGH and alerts the warden.")


if __name__ == "__main__":
    main()
