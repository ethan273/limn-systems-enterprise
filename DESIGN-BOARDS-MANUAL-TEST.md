# Design Boards - Manual Testing Guide

## 🚨 Critical: This test verifies the infinite loop bug is fixed

**Date**: 2025-10-11
**Issue Fixed**: Infinite re-render loop causing Safari crashes

---

## Test Setup

1. ✅ Dev server running on http://localhost:3000
2. ✅ Clear browser cache (Cmd+Shift+R in Safari)
3. ✅ Open Activity Monitor to watch memory usage (optional but recommended)

---

## Test 1: Homepage Load (Safety Check)

**Steps:**
1. Open http://localhost:3000 in Safari
2. Wait 10 seconds

**Expected:**
- ✅ Homepage loads normally
- ✅ "Go to Dashboard" button visible
- ✅ No crashes or freezes
- ✅ Memory usage stable (~300-500MB)

**Status:** [ ] PASS / [ ] FAIL

---

## Test 2: Design Boards List Page

**Steps:**
1. Navigate to http://localhost:3000/design/boards
2. Wait 10 seconds
3. Check for "Create New Board" button

**Expected:**
- ✅ Page loads without crashing
- ✅ "Create New Board" button visible
- ✅ Empty state or list of boards shown
- ✅ No console errors
- ✅ Memory usage remains stable

**Status:** [ ] PASS / [ ] FAIL

---

## Test 3: Create New Board (Critical Test)

**Steps:**
1. Click "Create New Board" button
2. Canvas should load
3. Wait 30 seconds (this is where the crash occurred before)
4. Watch Activity Monitor for memory spikes

**Expected:**
- ✅ Canvas loads successfully
- ✅ Drawing toolbar appears at top
- ✅ Properties panel appears on right
- ✅ Layers panel appears below properties
- ✅ NO memory spike (should stay under 1GB)
- ✅ NO browser freeze
- ✅ NO crash

**Status:** [ ] PASS / [ ] FAIL

---

## Test 4: Drawing Tools

**Steps:**
1. Click "Rectangle" tool in toolbar
2. Click and drag on canvas to draw a rectangle
3. Click "Circle" tool
4. Draw a circle
5. Click "Text" tool
6. Click on canvas and type "Test"

**Expected:**
- ✅ All tools respond immediately
- ✅ Shapes appear on canvas
- ✅ Text is editable
- ✅ No lag or freezing
- ✅ Memory stays stable

**Status:** [ ] PASS / [ ] FAIL

---

## Test 5: Keyboard Shortcuts (Critical - This Used to Trigger the Loop)

**Steps:**
1. Draw 2-3 shapes on canvas
2. Select a shape
3. Press Cmd+C (copy)
4. Press Cmd+V (paste)
5. Press Cmd+Z (undo)
6. Press Cmd+Shift+Z (redo)
7. Press Delete (delete shape)
8. Press Cmd+D (duplicate)
9. Press Cmd+A (select all)

**Expected:**
- ✅ All shortcuts work correctly
- ✅ NO infinite loop triggered
- ✅ NO memory spike
- ✅ NO browser freeze
- ✅ Undo/redo stack works properly

**Status:** [ ] PASS / [ ] FAIL

---

## Test 6: Properties Panel

**Steps:**
1. Draw a rectangle
2. Select it
3. Open Properties panel on right
4. Change fill color
5. Adjust opacity slider
6. Change stroke width

**Expected:**
- ✅ Properties panel shows selected object
- ✅ Color changes apply immediately
- ✅ Sliders work smoothly
- ✅ NO re-render loops
- ✅ Canvas updates correctly

**Status:** [ ] PASS / [ ] FAIL

---

## Test 7: Layers Panel

**Steps:**
1. Draw 3-4 objects on canvas
2. Scroll to Layers panel
3. Click on different layers
4. Toggle visibility (eye icon)
5. Reorder layers (up/down arrows)

**Expected:**
- ✅ Layers list shows all objects
- ✅ Click selects objects
- ✅ Visibility toggles work
- ✅ Reordering works
- ✅ NO crashes

**Status:** [ ] PASS / [ ] FAIL

---

## Test 8: Export Functions

**Steps:**
1. Draw some objects on canvas
2. Click "Export" dropdown in toolbar
3. Click "Export as PNG"
4. Check Downloads folder
5. Try "Export as SVG"
6. Try "Export as JSON"

**Expected:**
- ✅ All export options work
- ✅ Files download successfully
- ✅ Files can be opened
- ✅ NO errors

**Status:** [ ] PASS / [ ] FAIL

---

## Test 9: Extended Stability Test (Most Important)

**Steps:**
1. Leave the Design Boards canvas open
2. Do NOT interact with it
3. Wait 5 minutes
4. Monitor memory in Activity Monitor

**Expected:**
- ✅ Memory usage stays flat (not increasing)
- ✅ CPU usage stays low (<5%)
- ✅ NO browser warnings
- ✅ NO crashes
- ✅ Browser remains responsive

**This test proves the infinite loop is fixed!**

**Status:** [ ] PASS / [ ] FAIL

---

## Test 10: Multiple Objects Performance

**Steps:**
1. Draw 20-30 objects on canvas
2. Select all (Cmd+A)
3. Move them around
4. Undo/redo several times
5. Delete half of them
6. Check memory usage

**Expected:**
- ✅ Canvas remains smooth
- ✅ No lag when moving objects
- ✅ Undo/redo works with many objects
- ✅ Memory stays reasonable (<1.5GB)

**Status:** [ ] PASS / [ ] FAIL

---

## Success Criteria

**All tests must PASS for the bug fix to be confirmed successful.**

Minimum requirements:
- ✅ No Safari crashes
- ✅ No system lockups
- ✅ Memory usage stays under 2GB
- ✅ No infinite re-render loops
- ✅ All features work correctly

---

## If Any Test Fails

1. Note which test failed
2. Check browser console for errors (Cmd+Option+C)
3. Take a screenshot if possible
4. Report back with:
   - Which test failed
   - What happened (crash, freeze, error)
   - Console error messages
   - Memory usage at time of failure

---

## Expected Console Output (Normal)

You should see:
```
✓ Ready in 2.7s
```

You should NOT see:
```
Warning: Maximum update depth exceeded
Error: Too many re-renders
Memory leak detected
```

---

## Browser Monitoring Tips

**Safari Activity Monitor:**
1. Safari → Develop → Show Web Inspector
2. Go to Timelines tab
3. Click Record
4. Watch for JavaScript CPU spikes (should be minimal)
5. Watch for memory growth (should be flat after initial load)

**macOS Activity Monitor:**
1. Open Activity Monitor
2. Sort by Memory
3. Find "Safari" or "Safari Web Content"
4. Watch for:
   - Memory growing continuously = BAD (infinite loop)
   - Memory stable after initial load = GOOD (bug fixed)

---

## Report Format

After completing all tests, report:

```
✅ PASS: Test 1 - Homepage Load
✅ PASS: Test 2 - Design Boards List
✅ PASS: Test 3 - Create New Board
... etc
```

Or if any failed:

```
❌ FAIL: Test 5 - Keyboard Shortcuts
Reason: Browser froze when pressing Cmd+Z
Memory: 8GB+ (spike)
Console: "Maximum update depth exceeded"
```

---

**Test conducted by:** _______________________
**Date/Time:** _______________________
**Safari Version:** _______________________
**macOS Version:** _______________________

---

## Additional Notes

- The bug was in `DesignBoardCanvas.tsx` lines 207, 237, 475, 506
- Fix: Removed `history` object from React dependency arrays
- This prevents event listeners from being recreated infinitely
- All functionality should work exactly the same as before
- Only difference: no more crashes!

---

**Good luck with testing! The app should be rock solid now. 🚀**
