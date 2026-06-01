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
export * from "./git"
export * from "./notifications"

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
import { cloneRepo, getGitStatus, getGitDiff, getGitLog } from "./git"
import { sendNotification } from "./notifications"

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
  cloneRepo,
  getGitStatus,
  getGitDiff,
  getGitLog,
  sendNotification,
}
