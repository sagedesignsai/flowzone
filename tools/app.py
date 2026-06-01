"""Flowzone Tools — Streamlit UI

Provides a browser frontend for the favicon generator and image-to-SVG tool.
"""

import importlib.util
import io
import zipfile
from pathlib import Path

import streamlit as st

# ---------------------------------------------------------------------------
# Import tool modules (sibling dirs with hyphens → use importlib)
# ---------------------------------------------------------------------------

TOOLS_DIR = Path(__file__).parent


def _import_from(file_path: str) -> object:
    name = Path(file_path).stem
    spec = importlib.util.spec_from_file_location(name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load module from {file_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


try:
    _favicon_mod = _import_from(str(TOOLS_DIR / "favicon" / "main.py"))
    _svg_mod = _import_from(str(TOOLS_DIR / "image-to-svg" / "main.py"))

    generate_favicons_bytes = _favicon_mod.generate_favicons_bytes
    convert_to_svg = _svg_mod.convert_to_svg
    HAS_DEPS = True
except ImportError as e:
    HAS_DEPS = False
    _import_error = str(e)

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Flowzone Tools",
    page_icon="🔧",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.title("🔧 Flowzone Tools")
st.markdown(
    "Developer utilities for generating favicons and vectorizing images."
)

if not HAS_DEPS:
    st.error(
        f"Could not load tool dependencies: {_import_error}\n\n"
        "Make sure you've installed requirements and are running from "
        "the `tools/` directory."
    )
    st.stop()

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


def _make_zip(files: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Tab 1 — Favicon Generator
# ---------------------------------------------------------------------------

tab_favicon, tab_svg = st.tabs(["📱 Favicon Generator", "🎨 Image to SVG"])

with tab_favicon:
    st.header("Favicon Generator")
    st.markdown(
        "Upload a square PNG to generate all standard favicon sizes "
        "(16×16 through 512×512), a multi-resolution `.ico`, and a PWA "
        "web app manifest."
    )

    uploaded = st.file_uploader(
        "Choose a PNG image",
        type=["png"],
        key="favicon_upload",
        help="Recommended: a square icon at least 512×512 px.",
    )

    if uploaded is not None:
        if uploaded.size and uploaded.size > MAX_UPLOAD_SIZE:
            st.error(f"File too large ({uploaded.size / 1024 / 1024:.1f} MB). Max 10 MB.")
            st.stop()

        # Preview
        col_a, col_b = st.columns([1, 2])
        with col_a:
            st.image(uploaded, caption="Source", width=200)

        with col_b:
            st.markdown(f"**File:** `{uploaded.name}`")
            st.markdown(f"**Size:** {uploaded.size / 1024:.1f} KB")

        if st.button("✨ Generate Favicons", type="primary", use_container_width=True):
            from PIL import Image

            with st.spinner("Generating favicon sizes…"):
                try:
                    img = Image.open(uploaded).convert("RGBA")
                    files = generate_favicons_bytes(img)
                except Exception as e:
                    st.error(f"Processing failed: {e}")
                    st.stop()

            st.success(f"Generated {len(files)} files!")

            # Preview grid of PNG sizes
            png_previews = {
                k: v for k, v in files.items()
                if k.endswith(".png")
            }
            if png_previews:
                st.subheader("Previews")
                cols = st.columns(len(png_previews))
                for col, (name, data) in zip(cols, png_previews.items()):
                    with col:
                        st.image(data, caption=name, use_container_width=True)

            # Download buttons — individual + combined zip
            st.subheader("Download")

            dl_cols = st.columns(3)
            with dl_cols[0]:
                st.download_button(
                    "📦 Download All (ZIP)",
                    data=_make_zip(files),
                    file_name="favicons.zip",
                    mime="application/zip",
                    use_container_width=True,
                )

            with dl_cols[1]:
                ico = files.get("favicon.ico")
                if ico:
                    st.download_button(
                        "📁 favicon.ico",
                        data=ico,
                        file_name="favicon.ico",
                        mime="image/x-icon",
                        use_container_width=True,
                    )

            with dl_cols[2]:
                manifest = files.get("site.webmanifest")
                if manifest:
                    st.download_button(
                        "📄 site.webmanifest",
                        data=manifest,
                        file_name="site.webmanifest",
                        mime="application/json",
                        use_container_width=True,
                    )

            # Individual PNG downloads in an expander
            with st.expander("Individual PNG files"):
                for name in sorted(png_previews.keys()):
                    st.download_button(
                        label=f"⬇ {name}",
                        data=png_previews[name],
                        file_name=name,
                        mime="image/png",
                    )

# ---------------------------------------------------------------------------
# Tab 2 — Image to SVG
# ---------------------------------------------------------------------------

with tab_svg:
    st.header("Image to SVG")
    st.markdown(
        "Upload a PNG to convert it into a clean vector SVG. "
        "Uses OpenCV thresholding + vtracer spline vectorization for "
        "smooth bezier curves."
    )

    uploaded_svg = st.file_uploader(
        "Choose a PNG image",
        type=["png"],
        key="svg_upload",
        help="Works best with high-contrast icons or line art.",
    )

    apply_gradient = st.checkbox(
        "Apply Flowzone gradient",
        value=True,
        help="Replace black fill with the Flowzone brand gradient.",
    )

    if uploaded_svg is not None:
        if uploaded_svg.size and uploaded_svg.size > MAX_UPLOAD_SIZE:
            st.error(f"File too large ({uploaded_svg.size / 1024 / 1024:.1f} MB). Max 10 MB.")
            st.stop()

        # Preview original
        st.subheader("Original")
        st.image(uploaded_svg, caption="Source PNG", width=300)

        if st.button("🎯 Convert to SVG", type="primary", use_container_width=True):
            with st.spinner("Vectorizing image…"):
                try:
                    svg_str = convert_to_svg(uploaded_svg.getvalue(), apply_gradient)
                except Exception as e:
                    st.error(f"Conversion failed: {e}")
                    st.stop()

            st.success("SVG generated!")

            # SVG preview
            st.subheader("Result")
            st.image(svg_str, caption="Generated SVG", width=300)

            # Download
            st.download_button(
                "⬇ Download SVG",
                data=svg_str,
                file_name="output.svg",
                mime="image/svg+xml",
                use_container_width=True,
            )

            # Raw SVG expander
            with st.expander("View raw SVG"):
                st.code(svg_str, language="xml")

# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------

st.divider()
st.caption(
    "Flowzone Developer Tools · "
    "[Source](https://github.com/novumi/flowzone/tree/main/tools)"
)
