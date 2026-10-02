import os
from PIL import Image

artifact_dir = r"C:\Users\perci\.gemini\antigravity-ide\brain\8736d66d-98b8-4b13-b536-2da97a6a51d6"
files = [
    "landing_hero_full.png",
    "playground_overview.png",
    "playground_active_session.png",
    "playground_verdict_decision.png",
]

TARGET_WIDTH = 960
TARGET_HEIGHT = int(1100 * (TARGET_WIDTH / 1440)) # 733

images = []
for f in files:
    path = os.path.join(artifact_dir, f)
    im = Image.open(path).convert("RGB")
    im_resized = im.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
    images.append(im_resized)

frames = []
durations = []

# Total sequence: ~15 seconds
# 4 stages. Each stage holds for 3.4 seconds, with 4 blend transition frames (80ms each)
HOLD_DURATION_MS = 3400
TRANSITION_FRAMES = 5
TRANSITION_STEP_MS = 70

for i in range(len(images)):
    curr_img = images[i]
    next_img = images[(i + 1) % len(images)]

    # Hold current frame
    frames.append(curr_img)
    durations.append(HOLD_DURATION_MS)

    # Don't transition back from last to first with crossfade if we want a clean loop restart, or transition smoothly:
    for t in range(1, TRANSITION_FRAMES + 1):
        alpha = t / (TRANSITION_FRAMES + 1)
        blended = Image.blend(curr_img, next_img, alpha)
        frames.append(blended)
        durations.append(TRANSITION_STEP_MS)

out_paths = [
    r"docs\assets\demo.gif",
    r"frontend\public\demo.gif",
]

# Convert frames to adaptive palette
palette_frames = []
for frame in frames:
    p = frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    palette_frames.append(p)

for out_path in out_paths:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    palette_frames[0].save(
        out_path,
        save_all=True,
        append_images=palette_frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
    )
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"Generated {out_path} ({size_mb:.2f} MB, {len(frames)} frames)")
