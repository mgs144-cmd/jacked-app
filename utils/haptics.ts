// Haptic feedback utilities for PWA
// Provides tactile feedback for user interactions

export const haptics = {
  /**
   * Light impact - for subtle interactions (button hover, small actions)
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },

  /**
   * Medium impact - for standard interactions (button press, selection)
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20)
    }
  },

  /**
   * Heavy impact - for important actions (submitting, confirming)
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(40)
    }
  },

  /**
   * Success pattern - for successful actions (like added, post created)
   */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  },

  /**
   * Error pattern - for errors or failed actions
   */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50])
    }
  },

  /**
   * Selection changed - for switching between options
   */
  selection: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15)
    }
  },

  /**
   * Notification - for alerts or notifications
   */
  notification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 100, 30, 100, 30])
    }
  },
}

// Example usage:
// import { haptics } from '@/utils/haptics'
//
// const handleLike = async () => {
//   haptics.medium() // Immediate feedback
//   await likePost()
//   haptics.success() // Confirmation feedback
// }
