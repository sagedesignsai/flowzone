/**
 * Desktop Tools — Barrel Export
 *
 * Re-exports all desktop sandbox tools for use in the desktop agent.
 * Also exports a single allDesktopTools object for convenient registration.
 */

export * from "./mouse"
export * from "./keyboard"
export * from "./screen"
export * from "./app"
export * from "./opencode"
export * from "./sandbox-context"

import {
  mouseLeftClick,
  mouseRightClick,
  mouseDoubleClick,
  mouseScroll,
  mouseMove,
  mouseDrag,
} from "./mouse"
import { keyboardType, keyboardPress, keyboardShortcut } from "./keyboard"
import { takeScreenshot, getScreenSize, getCursorPosition } from "./screen"
import { launchApp, openFile, getWindowTitle, runShellCommand } from "./app"
import { runOpenCodeTask } from "./opencode"

export const allDesktopTools = {
  mouseLeftClick,
  mouseRightClick,
  mouseDoubleClick,
  mouseScroll,
  mouseMove,
  mouseDrag,
  keyboardType,
  keyboardPress,
  keyboardShortcut,
  takeScreenshot,
  getScreenSize,
  getCursorPosition,
  launchApp,
  openFile,
  getWindowTitle,
  runShellCommand,
  runOpenCodeTask,
}
