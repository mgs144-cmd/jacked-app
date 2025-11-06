# Design & Development Workflow

Guide for redesigning, tweaking, and iterating on your Jacked app.

## Quick Start

### 1. Run Locally

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

### 2. Make Changes

Edit files in your codebase. Changes will automatically reload in the browser (Hot Module Replacement).

### 3. Test Your Changes

- Check all affected pages
- Test on mobile (use browser dev tools)
- Verify functionality still works

### 4. Deploy Updates

```bash
# Commit and push changes
git add .
git commit -m "Update design: [describe changes]"
git push
```

Vercel will automatically deploy your changes.

## File Structure for Design Changes

### Colors & Branding
- **Location:** `tailwind.config.ts`
- **What to change:** 
  - Primary color (`#950606`)
  - Background colors
  - Text colors
  - Border colors

```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#950606',  // Change this to your new red
    dark: '#7a0505',      // Darker shade
    light: '#b30808',     // Lighter shade
  },
}
```

### Global Styles
- **Location:** `app/globals.css`
- **What to change:**
  - Font imports
  - Base styles
  - Scrollbar styling
  - Dark mode support

### Component Styling
- **Location:** `components/` folder
- **Files:**
  - `Navbar.tsx` - Navigation bar
  - `PostCard.tsx` - Post display cards
  - `CommentForm.tsx` - Comment input
  - `CommentList.tsx` - Comments display

### Page Layouts
- **Location:** `app/` folder
- **Files:**
  - `app/feed/page.tsx` - Main feed
  - `app/create/page.tsx` - Create post page
  - `app/profile/page.tsx` - User profile
  - `app/premium/page.tsx` - Premium subscription
  - `app/settings/page.tsx` - Settings page
  - `app/auth/login/page.tsx` - Login page
  - `app/auth/signup/page.tsx` - Signup page

## Common Design Tweaks

### Change Primary Color

1. Open `tailwind.config.ts`
2. Update the `primary` color values
3. Save - changes apply immediately

### Update Typography

1. Open `app/globals.css`
2. Change the Google Fonts import:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
   ```
3. Update font family in `tailwind.config.ts`:
   ```typescript
   fontFamily: {
     sans: ['Inter', 'system-ui', 'sans-serif'],
   }
   ```

### Adjust Spacing & Layout

- Use Tailwind utility classes directly in components
- Common utilities:
  - `p-4` = padding
  - `mb-6` = margin bottom
  - `space-y-4` = vertical spacing between children
  - `max-w-2xl` = max width
  - `rounded-lg` = border radius

### Modify Border Radius

1. Update `tailwind.config.ts`:
   ```typescript
   borderRadius: {
     DEFAULT: '12px',  // Change this
   }
   ```

### Change Shadows

In any component, update shadow classes:
- `shadow-sm` - small shadow
- `shadow` - default shadow
- `shadow-lg` - large shadow
- Or create custom in `tailwind.config.ts`

## Component-Level Changes

### Navbar (Navigation)

**File:** `components/Navbar.tsx`

- Change icon sizes: `w-5 h-5` → `w-6 h-6`
- Update spacing: `space-x-6` → `space-x-8`
- Modify colors: `text-primary` → `text-gray-600`
- Change position: `fixed bottom-0` → `fixed top-0`

### Post Cards

**File:** `components/PostCard.tsx`

- Adjust image aspect ratio: `aspect-square` → `aspect-video`
- Change card padding: `p-4` → `p-6`
- Modify border: `border-gray-200` → `border-gray-300`
- Update like/comment button sizes

### Forms

**Files:** `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `components/CommentForm.tsx`

- Change input padding: `py-3` → `py-4`
- Update border radius: `rounded-lg` → `rounded-xl`
- Modify button styles: `bg-primary` → `bg-gradient-to-r from-primary to-primary-dark`

## Testing Your Changes

### Local Testing

1. **Desktop View:**
   - Test in browser at full width
   - Check all pages work correctly

2. **Mobile View:**
   - Open browser dev tools (F12)
   - Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
   - Test on iPhone, iPad, Android sizes
   - Check touch interactions

3. **Responsive Breakpoints:**
   - Tailwind uses: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
   - Test at different screen sizes

### Before Deploying

- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Forms submit properly
- [ ] Images/videos display correctly
- [ ] Mobile layout looks good
- [ ] No console errors

## Design System Reference

### Colors
- **Primary:** `#950606` (red)
- **Background:** `#FFFFFF` (white)
- **Text:** `#000000` (black)
- **Gray scale:** `gray-50` through `gray-900`

### Typography
- **Font:** Inter
- **Sizes:** `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`
- **Weights:** `font-normal`, `font-semibold`, `font-bold`

### Spacing
- Uses Tailwind's spacing scale (4px increments)
- Common: `4`, `8`, `12`, `16`, `20`, `24`, `32`

### Border Radius
- Default: `12px` (`rounded-lg`)
- Options: `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

## Advanced Customization

### Custom CSS Classes

Add to `app/globals.css`:

```css
@layer components {
  .custom-button {
    @apply px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors;
  }
}
```

Use in components: `<button className="custom-button">Click</button>`

### Dark Mode (Optional)

1. Enable in `tailwind.config.ts`:
   ```typescript
   darkMode: 'class',
   ```

2. Add dark mode styles:
   ```css
   @media (prefers-color-scheme: dark) {
     /* Dark mode styles */
   }
   ```

### Custom Animations

Add to `tailwind.config.ts`:

```typescript
extend: {
  animation: {
    'fade-in': 'fadeIn 0.5s ease-in',
  },
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
  },
}
```

## Deployment Workflow

### 1. Make Changes Locally
```bash
npm run dev
# Edit files, test changes
```

### 2. Commit Changes
```bash
git add .
git commit -m "Update: [describe your changes]"
```

### 3. Push to GitHub
```bash
git push
```

### 4. Vercel Auto-Deploys
- Vercel automatically detects the push
- Builds and deploys your changes
- Usually takes 1-3 minutes

### 5. Verify Deployment
- Check Vercel dashboard for deployment status
- Visit your live site to confirm changes

## Tips for Effective Redesigns

1. **Start Small:** Change one thing at a time to see the impact
2. **Use Browser DevTools:** Inspect elements, test CSS changes live
3. **Keep Consistent:** Maintain design patterns across pages
4. **Test Mobile First:** Many users will be on mobile
5. **Get Feedback:** Test with real users before major changes
6. **Version Control:** Commit often with descriptive messages

## Common Issues & Solutions

### Changes Not Showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check if build completed in Vercel

### Styling Conflicts
- Check Tailwind classes aren't being overridden
- Verify custom CSS is in the right place
- Use `!important` sparingly: `!bg-primary`

### Build Errors
- Check console for TypeScript errors
- Run `npm run build` locally before pushing
- Fix linting errors: `npm run lint`

## Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Lucide Icons:** https://lucide.dev/icons (icons used in the app)

## Getting Help

If you encounter issues:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Test locally with `npm run dev`
4. Check Tailwind/Next.js documentation

