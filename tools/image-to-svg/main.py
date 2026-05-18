import os
import cv2
import vtracer

def convert_icon_to_svg(input_img_path: str, output_svg_path: str):
    print(f"Reading image from {input_img_path}...")
    img = cv2.imread(input_img_path)
    
    # Pre-process using OpenCV
    print("Thresholding to isolate core strokes...")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
    
    # Save a temporary black/white core file for vtracer
    tmp_path = "/tmp/flowzone_binary_tmp.png"
    cv2.imwrite(tmp_path, thresh)
    
    print("Vectorizing splines...")
    vtracer.convert_image_to_svg_py(
        tmp_path,
        output_svg_path,
        colormode='binary',
        mode='spline',
        filter_speckle=4,
        corner_threshold=60,
        length_threshold=4.0,
        path_precision=8
    )
    
    print("Applying Flowzone gradients...")
    with open(output_svg_path, 'r') as f:
        svg_content = f.read()
    
    # vtracer binary output yields paths with fill="#000000". We replace this.
    flowzone_defs = '''
  <defs>
    <linearGradient id="flowzone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="50%" stop-color="#4facfe" />
      <stop offset="100%" stop-color="#8a2387" />
    </linearGradient>
  </defs>
'''
    
    import re
    
    # Inject defs right after the first <svg ...> opening tag
    new_svg = re.sub(r'(<svg[^>]*>)', r'\1' + flowzone_defs, svg_content)
    
    # Replace solid black filled paths with the gradient URL.
    # vtracer might output either '#000000' or similar
    new_svg = new_svg.replace('fill="#000000"', 'fill="url(#flowzone-grad)"')
    
    with open(output_svg_path, 'w') as f:
        f.write(new_svg)
        
    print(f"Success! Elegant vector curves saved to {output_svg_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, '../../public/flowzone_app_icon.png')
    output_file = os.path.join(script_dir, '../../public/flowzone_logomark.svg')
    convert_icon_to_svg(input_file, output_file)
