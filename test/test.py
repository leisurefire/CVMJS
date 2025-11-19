import os
import sys
from PIL import Image

FRAME_DURATION_MS = 50  # 1/20 秒

def ensure_rgba(img):
    if img.mode != "RGBA":
        return img.convert("RGBA")
    return img

def sprite_to_webp(input_path, frame_width, output_path):
    sprite = Image.open(input_path)
    sprite = ensure_rgba(sprite)

    sheet_width, sheet_height = sprite.size
    if frame_width <= 0:
        raise ValueError("帧宽必须大于 0")

    frames = []
    x = 0
    while x + frame_width <= sheet_width:
        frame = sprite.crop((x, 0, x + frame_width, sheet_height))
        frames.append(ensure_rgba(frame))
        x += frame_width

    if not frames:
        print(f"[警告] 无法切出帧: {input_path}")
        return

    # 关键参数：确保是真 • 动图
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        format="WEBP",
        lossless=False,           # 默认无损（如果想降低体积可改为 False）
        method=6,                # 压缩等级（0-6），6 最优
        minimize_size=True,     # 避免 WebP bug 导致静态
        quality=80,             # lossless=True 时此参数无影响
        disposal=2               # 确保逐帧刷新，不叠加
    )

    print(f"[完成] {input_path} → {output_path}  ({len(frames)} frames)")

def main(arg):
    frame_width = int(arg)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(script_dir, "images")

    if not os.path.isdir(images_dir):
        print(f"未找到目录: {images_dir}")
        sys.exit(1)

    for filename in os.listdir(images_dir):
        if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
            continue

        input_path = os.path.join(images_dir, filename)
        output_name = os.path.splitext(filename)[0] + ".webp"
        output_path = os.path.join(images_dir, output_name)

        sprite_to_webp(input_path, frame_width, output_path)

    print("全部处理完毕。")

if __name__ == "__main__":
    main(75)