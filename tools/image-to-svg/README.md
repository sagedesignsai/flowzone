# Flowzone Image-to-SVG Tool

This tool converts the Flowzone app icon (PNG) into a high-quality vector SVG with smooth bezier curves and custom gradients.

## Why are there errors in my IDE?

If you see an error like `Cannot find module 'cv2'`, it's because this tool uses a **Virtual Environment** (`.venv`) to keep the project clean and avoid installing Python packages globally on your system.

Your code editor (like Cursor or VS Code) is likely looking at the **System Python** instead of the local environment.

### How to Fix in Cursor/VS Code:
1.  Open `tools/image-to-svg/main.py`.
2.  Press **Cmd + Shift + P** (Mac) or **Ctrl + Shift + P** (Linux/Windows).
3.  Type **"Python: Select Interpreter"**.
4.  Choose the one that points to `./.venv/bin/python` (it should be labeled as a virtual environment).

## How to Run

Instead of running Python directly, you can use the shortcut defined in the root `package.json`:

```bash
pnpm tool:svg
```

This will automatically enter the directory and use the correct virtual environment to regenerate your logo.
