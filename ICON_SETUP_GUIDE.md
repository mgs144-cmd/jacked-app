# Icon Setup Guide

This guide explains how to set up the app icons for browser tabs and iOS home screen.

## Required Icon Files

You need to create the following icon files and place them in the `/public` directory:

### 1. Browser Tab Icon (Favicon)
- **File:** `public/icon.png`
- **Size:** 32x32 pixels (or 16x16)
- **Format:** PNG
- **Usage:** Shows in browser tabs

### 2. Standard App Icons
- **File:** `public/icon-192.png`
- **Size:** 192x192 pixels
- **Format:** PNG
- **Usage:** Android home screen, PWA

- **File:** `public/icon-512.png`
- **Size:** 512x512 pixels
- **Format:** PNG
- **Usage:** Android home screen, PWA

### 3. Apple Touch Icon (iOS Home Screen)
- **File:** `public/apple-icon.png`
- **Size:** 180x180 pixels (required by Apple)
- **Format:** PNG
- **Usage:** iOS home screen when users "Add to Home Screen"

## How to Create Icons

### Option 1: Use an Online Tool
1. Go to [Favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your logo/image
3. Download the generated icons
4. Place them in the `/public` directory

### Option 2: Create Manually
1. Design your icon in a graphics editor (Figma, Photoshop, etc.)
2. Export at the required sizes:
   - 32x32px → `icon.png`
   - 192x192px → `icon-192.png`
   - 512x512px → `icon-512.png`
   - 180x180px → `apple-icon.png`
3. Save as PNG files
4. Place all files in the `/public` directory

### Option 3: Use Your Logo
If you have a logo file:
1. Open it in an image editor
2. Resize to each required size
3. Make sure it looks good at small sizes (32x32)
4. Export and save to `/public`

## Icon Design Tips

- **Keep it simple:** Icons should be recognizable at small sizes
- **Use your brand color:** Match your app's primary color (#950606)
- **High contrast:** Ensure icons are visible on both light and dark backgrounds
- **Square format:** Icons are displayed in square containers
- **No text:** Avoid small text that becomes unreadable at small sizes

## File Structure

After setup, your `/public` directory should look like:

```
public/
├── icon.png          (32x32 - browser tab)
├── icon-192.png      (192x192 - Android/PWA)
├── icon-512.png      (512x512 - Android/PWA)
├── apple-icon.png    (180x180 - iOS home screen)
└── manifest.json     (already created)
```

## Testing

### Browser Tab Icon
1. Deploy your app
2. Open in Chrome/Firefox/Safari
3. Check the browser tab - you should see your icon

### iOS Home Screen Icon
1. Open your app on an iPhone/iPad
2. Tap the Share button
3. Select "Add to Home Screen"
4. The icon should appear on the home screen

### Android Home Screen Icon
1. Open your app on Android
2. Tap the menu (three dots)
3. Select "Add to Home Screen" or "Install App"
4. The icon should appear on the home screen

## Current Status

✅ **Metadata configured** - Icons are set up in `app/layout.tsx`
✅ **Manifest created** - PWA manifest is ready in `public/manifest.json`
⏳ **Icons needed** - You need to create and add the icon files

## Quick Start

1. Create or find your app logo/icon
2. Resize to the 4 required sizes
3. Save as PNG files in `/public`
4. Deploy - icons will automatically work!

## Troubleshooting

**Icons not showing?**
- Make sure files are in `/public` directory (not `/app`)
- Clear browser cache (hard refresh: Cmd+Shift+R)
- Check file names match exactly: `icon.png`, `apple-icon.png`, etc.

**iOS icon not working?**
- Must be exactly 180x180 pixels
- File must be named `apple-icon.png` exactly
- Clear Safari cache and try again

**Icons look blurry?**
- Make sure you're using the correct pixel dimensions
- Use high-quality source images
- Avoid upscaling small images

