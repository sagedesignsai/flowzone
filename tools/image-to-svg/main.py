import os
import re
import tempfile
import cv2
import vtracer

FLOWZONE_DEFS = """
  <defs>
    <linearGradient id="flowzone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="50%" stop-color="#4facfe" />
      <stop offset="100%" stop-color="#8a2387" />
    </linearGradient>
  </defs>
"""


def convert_to_svg(image_data: bytes, apply_gradient: bool = True) -> str:
    """Convert PNG image bytes to an SVG string.

    Pre-processes with OpenCV thresholding, vectorizes with vtracer, and
    optionally applies the Flowzone gradient.
    """
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
        tmp_in.write(image_data)
        tmp_in_path = tmp_in.name

    tmp_out_path = tempfile.mktemp(suffix=".svg")

    try:
        img = cv2.imread(tmp_in_path)
        if img is None:
            raise ValueError("Could not read image — may be corrupt or unsupported format.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
        cv2.imwrite(tmp_in_path, thresh)

        vtracer.convert_image_to_svg_py(
            tmp_in_path,
            tmp_out_path,
            colormode="binary",
            mode="spline",
            filter_speckle=4,
            corner_threshold=60,
            length_threshold=4.0,
            path_precision=8,
        )

        with open(tmp_out_path, "r") as f:
            svg_content = f.read()

        if apply_gradient:
            svg_content = re.sub(r"(<svg[^>]*>)", r"\1" + FLOWZONE_DEFS, svg_content)
            svg_content = svg_content.replace(
                'fill="#000000"', 'fill="url(#flowzone-grad)"'
            )

        return svg_content

    finally:
        os.unlink(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.unlink(tmp_out_path)


def convert_icon_to_svg(input_img_path: str, output_svg_path: str):
    print(f"Reading image from {input_img_path}...")
    with open(input_img_path, "rb") as f:
        image_data = f.read()

    svg_content = convert_to_svg(image_data)

    with open(output_svg_path, "w") as f:
        f.write(svg_content)

    print(f"Success! Elegant vector curves saved to {output_svg_path}")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "../../public/flowzone_app_icon.png")
    output_file = os.path.join(script_dir, "../../public/flowzone_logomark.svg")
    convert_icon_to_svg(input_file, output_file)
