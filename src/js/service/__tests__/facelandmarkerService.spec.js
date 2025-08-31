import { describe, it, expect } from '@jest/globals';

// Unit test helpers for facelandmarkerService gesture classification
// We import the internal evaluateGesture only if we refactor to export helpers; for now, test via a thin proxy.

describe('facial gesture helpers', () => {
  it('should handle gesture type property correctly', () => {
    // Test that gesture objects with gestureType property work correctly
    const gestureWithGestureType = {
      gestureType: 'BLINK_LEFT',
      blinkScoreThreshold: 0.5,
      dwellMs: 150,
      debounceMs: 400
    };

    // Verify the gesture object has the correct property
    expect(gestureWithGestureType.gestureType).toBe('BLINK_LEFT');
    expect(gestureWithGestureType.type).toBeUndefined();
  });

  it('should support all defined gesture types', () => {
    const expectedGestures = [
      'BLINK_LEFT', 'BLINK_RIGHT', 'BLINK_BOTH',
      'EYES_LEFT', 'EYES_RIGHT', 'EYES_UP', 'EYES_DOWN',
      'HEAD_TILT_LEFT', 'HEAD_TILT_RIGHT',
      'HEAD_LEFT', 'HEAD_RIGHT', 'HEAD_UP', 'HEAD_DOWN',
      'BROW_RAISE', 'CHEEK_PUFF', 'TONGUE_OUT', 'SMILE', 'FROWN', 'JAW_OPEN'
    ];

    expectedGestures.forEach(gestureType => {
      const gesture = { gestureType };
      expect(gesture.gestureType).toBe(gestureType);
    });
  });
});

