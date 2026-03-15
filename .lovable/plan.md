

## Analysis

The issue is a race condition in `useIsMobile()`. The hook initializes `isMobile` as `undefined`, and `!!undefined` returns `false`. Since `StoryPreviewModal` is freshly mounted when a story is clicked (conditional rendering in `StoriesCarousel`), the first render sees `isMobile = false` and renders the **Dialog** (desktop modal) instead of the fullscreen view. The effect then fires and sets `isMobile = true`, but the Dialog is already mounted and visible.

## Plan

1. **Fix `useIsMobile` hook** to return a correct initial value synchronously by using `window.innerWidth` as the initial state instead of `undefined`:
   ```ts
   const [isMobile, setIsMobile] = useState(
     typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
   );
   ```
   This ensures the very first render already knows it's mobile, so the fullscreen path renders immediately.

## Files to Change

- `src/hooks/use-mobile.tsx` — Initialize state with `window.innerWidth` check instead of `undefined`

