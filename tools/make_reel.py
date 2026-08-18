"""
Generates a vertical (9:16) time-lapse video of a Data Viz France
visualization, suitable for Instagram Reels / TikTok.

Requires the site to already be served (`npm run build && npm run preview`,
or a deployed Netlify URL) and ffmpeg on PATH (`brew install ffmpeg`).

Usage:
    .venv/bin/python tools/make_reel.py --viz prenoms
    .venv/bin/python tools/make_reel.py --viz prenoms --duration 15
    .venv/bin/python tools/make_reel.py --url https://dataviz-france.netlify.app/reel/prenoms

How it works:
    1. Playwright drives a real Chromium browser at /reel/<viz>, with the
       viewport set directly to the target 1080x1920 resolution (Playwright's
       video recording does not scale content up to a record_video_size
       larger than the viewport - it pads/crops instead - so the viewport
       itself must already be the final resolution). /reel/<viz> is already
       a bare 9:16 stage, so no style override is injected at record time.
    2. The visualization publishes window.__reel (see src/reel/reelDriver.ts)
       once its data and geometry are painted; frames are stepped through
       via window.__reel.setFrame(i) on a self-correcting schedule (targets
       absolute wall-clock times rather than sleeping a fixed delay after
       each render), so per-frame render cost doesn't stack up and blow past
       the requested total duration.
    3. ffmpeg trims out the page-load moment, scales/paces to the requested
       fps, adds a light fade in/out, and encodes to H.264 MP4.
"""
import argparse
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import sync_playwright

VIEWPORT = {"width": 1080, "height": 1920}
DEFAULT_BASE_URL = "http://localhost:4173"


def check_server(url):
    try:
        urllib.request.urlopen(url, timeout=3)
    except Exception:
        sys.exit(
            f"Could not reach {url}\n"
            f"Build and serve the site first: npm run build && npm run preview"
        )


def check_ffmpeg():
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found on PATH. Install it with: brew install ffmpeg")


# Each setFrame() call re-renders the visualization's map(s) and costs
# roughly this much wall-clock time. If the requested duration can't fit one
# step per frame at at least this pace, frames are subsampled instead of
# silently overshooting the requested duration.
MIN_STEP_DELAY = 0.02


def get_reel_driver(page):
    page.wait_for_function("() => window.__reel?.ready === true")
    return page.evaluate("() => ({ frameCount: window.__reel.frameCount })")


def record(url, start_frame, end_frame, duration, intro_hold, outro_hold, video_dir):
    frames = list(range(start_frame, end_frame + 1))
    animate_budget = duration - intro_hold - outro_hold
    if animate_budget <= 0:
        sys.exit(
            f"Duration too short: {intro_hold + outro_hold}s of intro/outro "
            f"hold alone exceeds --duration {duration}s."
        )

    max_steps = max(1, int(animate_budget / MIN_STEP_DELAY))
    if len(frames) - 1 > max_steps:
        stride = -(-(len(frames) - 1) // max_steps)  # ceil division
        thinned = frames[::stride]
        if thinned[-1] != frames[-1]:
            thinned.append(frames[-1])
        print(
            f"{len(frames)} frames won't fit in {duration}s at a renderable pace; "
            f"showing every {stride} frame(s) ({len(thinned)} frames) instead."
        )
        frames = thinned

    n_steps = len(frames) - 1
    step_delay = animate_budget / n_steps

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport=VIEWPORT,
            record_video_dir=str(video_dir),
            record_video_size=VIEWPORT,
        )
        record_start = time.time()
        page = context.new_page()
        page.goto(url)
        get_reel_driver(page)

        def set_frame(i):
            page.evaluate("(i) => window.__reel.setFrame(i)", i)

        set_frame(frames[0])

        t0 = time.time()
        time.sleep(intro_hold)

        # Schedule against absolute target times rather than sleeping
        # step_delay after each call, so render cost doesn't stack on top
        # of the budget and blow past the target total duration.
        loop_start = time.time()
        for i, frame in enumerate(frames[1:], start=1):
            set_frame(frame)
            target = loop_start + i * step_delay
            remaining = target - time.time()
            if remaining > 0:
                time.sleep(remaining)

        time.sleep(outro_hold)
        clean_end = time.time() - t0

        video_path_obj = page.video
        context.close()
        browser.close()

        actual_raw_path = Path(video_path_obj.path())
        trim_start = t0 - record_start
        trim_duration = clean_end
        return actual_raw_path, trim_start, trim_duration


def encode(raw_video, trim_start, trim_duration, fps, output_path):
    fade_out_start = max(0.0, trim_duration - 0.5)
    vf = f"fps={fps},fade=t=in:st=0:d=0.4,fade=t=out:st={fade_out_start}:d=0.5"
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(trim_start),
        "-i", str(raw_video),
        "-t", str(trim_duration),
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-crf", "18", "-preset", "medium",
        "-movflags", "+faststart",
        "-an",
        str(output_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--viz", default="prenoms", help="Viz id to record, builds <base-url>/reel/<viz> (default: %(default)s)")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Site base URL (default: %(default)s)")
    parser.add_argument("--url", default=None, help="Full reel URL, overrides --viz/--base-url")
    parser.add_argument("--start-frame", type=int, default=None, help="Defaults to frame 0")
    parser.add_argument("--end-frame", type=int, default=None, help="Defaults to the viz's last frame")
    parser.add_argument("--duration", type=float, default=30.0, help="Total clip length in seconds (default: %(default)s)")
    parser.add_argument("--intro-hold", type=float, default=1.0, help="Seconds to hold the first frame (default: %(default)s)")
    parser.add_argument("--outro-hold", type=float, default=2.0, help="Seconds to hold the last frame (default: %(default)s)")
    parser.add_argument("--fps", type=int, default=30, help="Output frame rate (default: %(default)s)")
    parser.add_argument("--output", default=None, help="Output mp4 path (default: reel/output/reel_<viz>.mp4)")
    args = parser.parse_args()

    check_ffmpeg()
    url = args.url or f"{args.base_url.rstrip('/')}/reel/{args.viz}"
    check_server(url)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT)
        page.goto(url)
        driver = get_reel_driver(page)
        browser.close()

    start_frame = args.start_frame if args.start_frame is not None else 0
    end_frame = args.end_frame if args.end_frame is not None else driver["frameCount"] - 1

    if args.output:
        output_path = Path(args.output).expanduser().resolve()
    else:
        output_dir = Path(__file__).parent.parent / "reel" / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"reel_{args.viz}.mp4"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Recording {url} (frames {start_frame}-{end_frame}) into a {args.duration}s clip...")

    with TemporaryDirectory() as tmp:
        raw_video, trim_start, trim_duration = record(
            url, start_frame, end_frame, args.duration,
            args.intro_hold, args.outro_hold, Path(tmp),
        )
        print(f"Recorded {trim_duration:.2f}s of clean footage, encoding...")
        encode(raw_video, trim_start, trim_duration, args.fps, output_path)

    print(f"Done: {output_path}")


if __name__ == "__main__":
    main()
