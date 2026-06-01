import os
import json
import io
from PIL import Image

SIZES = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-96x96.png": 96,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

ICO_SIZES = [16, 32, 48]

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(TOOLS_DIR, "../../public")
FAVICON_DIR = os.path.join(PUBLIC_DIR, "favicon")


def make_square(img: Image.Image) -> Image.Image:
    size = min(img.size)
    left = (img.width - size) // 2
    top = (img.height - size) // 2
    return img.crop((left, top, left + size, top + size))


def generate_favicons_bytes(source: Image.Image) -> dict[str, bytes]:
    """Generate all favicon files from a source image.

    Returns a dict mapping filenames (e.g. 'favicon-32x32.png', 'favicon.ico',
    'site.webmanifest') to their byte contents.
    """
    source = make_square(source)

    result = {}

    for name, size in SIZES.items():
        resized = source.resize((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, "PNG")
        result[name] = buf.getvalue()

    # Multi-size .ico
    ico_frames = [source.resize((s, s), Image.LANCZOS) for s in ICO_SIZES]
    ico_buf = io.BytesIO()
    ico_frames[0].save(
        ico_buf,
        format="ICO",
        sizes=[(s, s) for s in ICO_SIZES],
        append_images=ico_frames[1:],
    )
    result["favicon.ico"] = ico_buf.getvalue()

    # PWA manifest
    manifest = {
        "name": "Flowzone",
        "short_name": "Flowzone",
        "icons": [
            {"src": "/favicon/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/favicon/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "theme_color": "#0a0a0a",
        "background_color": "#0a0a0a",
        "display": "standalone",
    }
    result["site.webmanifest"] = json.dumps(manifest, indent=2).encode()

    return result


def generate_favicons(input_path: str):
    print(f"Reading source from {input_path}...")
    source = Image.open(input_path).convert("RGBA")

    files = generate_favicons_bytes(source)

    os.makedirs(FAVICON_DIR, exist_ok=True)

    for name, data in files.items():
        if name == "favicon.ico":
            out = os.path.join(PUBLIC_DIR, name)
        else:
            out = os.path.join(FAVICON_DIR, name)
        with open(out, "wb") as f:
            f.write(data)
        print(f"  -> {out}")

    print("\nDone. All favicons generated.")


if __name__ == "__main__":
    input_file = os.path.join(PUBLIC_DIR, "flowzone_app_icon.png")
    if not os.path.exists(input_file):
        input_file = os.path.join(PUBLIC_DIR, "brand", "app_icon.png")
    generate_favicons(input_file)
