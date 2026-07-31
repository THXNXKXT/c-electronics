import assert from "node:assert/strict";
import test from "node:test";
import {
  getDialogKeyboardAction,
  getNextDialogFocusIndex,
} from "../src/lib/dialog-focus";

test("dialog focus wraps forward and backward", () => {
  assert.equal(getNextDialogFocusIndex(0, 3, true), 2);
  assert.equal(getNextDialogFocusIndex(2, 3, false), 0);
  assert.equal(getNextDialogFocusIndex(1, 3, false), 2);
});

test("dialog focus enters from outside in the requested direction", () => {
  assert.equal(getNextDialogFocusIndex(-1, 3, false), 0);
  assert.equal(getNextDialogFocusIndex(-1, 3, true), 2);
  assert.equal(getNextDialogFocusIndex(-1, 0, false), null);
});

test("dialog keyboard actions distinguish Escape and Tab", () => {
  assert.equal(getDialogKeyboardAction("Escape"), "cancel");
  assert.equal(getDialogKeyboardAction("Tab"), "move-focus");
  assert.equal(getDialogKeyboardAction("Enter"), null);
});
