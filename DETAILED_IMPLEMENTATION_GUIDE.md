# Detailed Implementation Guide

## Overview
This guide outlines all steps needed to implement the remaining features. I'll implement them all, but this serves as documentation.

---

## 1. Onboarding: $1 One-Time Charge

### Database Changes
- Add `has_paid_onboarding` boolean column to `profiles` table
- Add `onboarding_payment_id` text column to track Stripe payment

### Code Changes
- Modify signup flow to redirect to payment before account creation
- Create Stripe checkout session for $1
- Add webhook handler to mark account as paid
- Update auth flow to require payment before account activation

### Files to Modify
- `app/auth/signup/page.tsx` - Add payment step
- `app/api/create-checkout-session/route.ts` - Add onboarding checkout
- `app/api/webhook/route.ts` - Handle onboarding payment confirmation
- Database migration SQL

---

## 2. PR Display System

### Database Changes
- Create `personal_records` table:
  - id (UUID)
  - user_id (UUID, FK to profiles)
  - exercise_name (TEXT)
  - weight (NUMERIC)
  - reps (INTEGER)
  - date (DATE)
  - video_url (TEXT, optional)
  - post_id (UUID, FK to posts, optional - links to PR post)
  - created_at (TIMESTAMPTZ)

### Code Changes
- Create PR display component for profile
- Add PR creation form
- Link PRs to posts when posting PR
- Display PRs on profile page

### Files to Create/Modify
- `components/PRDisplay.tsx` - Display PRs on profile
- `components/PRForm.tsx` - Form to create/edit PRs
- `app/profile/page.tsx` - Add PR section
- Database migration SQL

---

## 3. Badge System

### Database Changes
- Create `badges` table:
  - id (UUID)
  - name (TEXT) - e.g., "Deadcember"
  - description (TEXT)
  - icon_url (TEXT, optional)
  - season (TEXT, optional) - e.g., "winter"
  - created_at (TIMESTAMPTZ)

- Create `user_badges` junction table:
  - user_id (UUID, FK to profiles)
  - badge_id (UUID, FK to badges)
  - earned_at (TIMESTAMPTZ)

### Code Changes
- Create badge display component
- Add badge assignment logic (manual or automatic)
- Display badges on profile
- Create "Deadcember" badge as example

### Files to Create/Modify
- `components/BadgeDisplay.tsx` - Show badges
- `app/profile/page.tsx` - Add badge section
- Database migration SQL

---

## 4. In-App Music Playback

### Code Changes
- Update PostCard to include audio player
- Use HTML5 audio element
- Handle Spotify preview URLs
- Add play/pause controls

### Files to Modify
- `components/PostCard.tsx` - Add audio player
- `components/MusicPlayer.tsx` - New component for post music

---

## 5. Album Cover on Posts

### Database Changes
- Add `song_album_art_url` to `posts` table

### Code Changes
- Update MusicSelector to capture album art
- Update PostCard to display album art
- Fetch album art from Spotify API

### Files to Modify
- `components/MusicSelector.tsx` - Capture album art
- `components/PostCard.tsx` - Display album art
- `app/api/search-music/route.ts` - Return album art URL

---

## 6. PR Posting Option

### Database Changes
- Add `is_pr_post` boolean to `posts` table
- Add `pr_exercise` text to `posts` table
- Add `pr_weight` numeric to `posts` table
- Add `pr_reps` integer to `posts` table

### Code Changes
- Add "Post PR" option to create post page
- Make PR posts visually distinct (special border/glow)
- Link PR posts to personal_records table

### Files to Modify
- `app/create/page.tsx` - Add PR posting option
- `components/PostCard.tsx` - Style PR posts differently
- Database migration SQL

---

## 7. Reps/Sets/Exercises System

### Database Changes
- Create `workout_exercises` table:
  - id (UUID)
  - post_id (UUID, FK to posts)
  - exercise_name (TEXT)
  - sets (INTEGER)
  - reps (INTEGER)
  - weight (NUMERIC, optional)
  - order (INTEGER) - for ordering exercises

### Code Changes
- Add collapsible workout details to post creation
- Display workout details on PostCard (collapsed by default)
- Add expand/collapse functionality

### Files to Create/Modify
- `components/WorkoutDetails.tsx` - Collapsible workout display
- `components/WorkoutForm.tsx` - Form to add exercises
- `app/create/page.tsx` - Add workout details section
- `components/PostCard.tsx` - Display workout details
- Database migration SQL

---

## 8. Bulk/Cut/Maintenance Indicator

### Database Changes
- Add `fitness_goal` text to `profiles` table (enum: 'bulk', 'cut', 'maintenance')

### Code Changes
- Add selector in settings
- Display indicator on profile
- Add visual indicator (icon/color)

### Files to Modify
- `app/settings/page.tsx` - Add fitness goal selector
- `app/profile/page.tsx` - Display fitness goal
- `components/FitnessGoalIndicator.tsx` - New component
- Database migration SQL

---

## 9. GIF Support in Comments

### Code Changes
- Integrate Giphy API or Tenor API
- Add GIF search/picker to comment form
- Display GIFs in comments
- Store GIF URL in comment content

### Files to Modify
- `components/CommentForm.tsx` - Add GIF picker
- `components/CommentList.tsx` - Display GIFs
- `app/api/search-gifs/route.ts` - New API route for GIF search

---

## Implementation Order

1. Database migrations (all at once)
2. Music features (in-app playback + album covers)
3. PR system (database + UI)
4. Workout details (reps/sets/exercises)
5. Badge system
6. Fitness goal indicator
7. GIF comments
8. Onboarding payment (last, requires Stripe setup)

---

## Database Migration File

All database changes will be in: `COMPLETE_FEATURES_MIGRATION.sql`

