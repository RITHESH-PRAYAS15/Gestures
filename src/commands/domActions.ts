// This file contains the logic that translates recognized gestures 
// into actual browser interactions (scrolling, clicking).

// We'll define 5 standard "Action Types" the user can train their gestures to trigger.
export const GestureAction = {
    SCROLL_DOWN: "Scroll Down",
    SCROLL_UP: "Scroll Up",
    NEXT_CHAPTER: "Next Chapter",
    PREV_CHAPTER: "Previous Chapter",
    PLAY_PAUSE: "Play/Pause Video",
    SKIP_FORWARD: "Skip Forward 10s",
    SKIP_BACKWARD: "Skip Backward 10s",
    NONE: "None"
} as const;

export type GestureAction = typeof GestureAction[keyof typeof GestureAction];

// Configuration for scroll speed.
const SCROLL_AMOUNT = 300; 

// A mapping from KNN Class IDs (0-4) to our human-readable actions.
// We will let the user customize this UI later, but here is the default map.
export const defaultGestureMap: Record<number, GestureAction> = {
    0: GestureAction.SCROLL_DOWN,
    1: GestureAction.SCROLL_UP,
    2: GestureAction.NEXT_CHAPTER,
    3: GestureAction.PREV_CHAPTER,
    4: GestureAction.NONE
};

/**
 * Executes a specific DOM action based on the string command.
 */
export const executeGestureAction = (action: GestureAction) => {
    switch (action) {
        case GestureAction.SCROLL_DOWN:
            window.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
            break;

        case GestureAction.SCROLL_UP:
            window.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
            break;

        case GestureAction.NEXT_CHAPTER:
            clickPaginationButton(['next', 'forward', '>', 'next chapter']);
            break;

        case GestureAction.PREV_CHAPTER:
            clickPaginationButton(['prev', 'previous', '<', 'back']);
            break;

        case GestureAction.PLAY_PAUSE:
            controlVideoElement('playpause');
            break;
            
        case GestureAction.SKIP_FORWARD:
            controlVideoElement('forward');
            break;

        case GestureAction.SKIP_BACKWARD:
            controlVideoElement('backward');
            break;

        case GestureAction.NONE:
        default:
            // Do nothing
            break;
    }
};

/**
 * Controls the largest playing video or the first video found on the page.
 */
const controlVideoElement = (action: 'playpause' | 'forward' | 'backward') => {
    // Find all videos on the page
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) return;

    // Usually the main video is the largest or currently playing. We'll grab the first large one or just the first.
    // For simplicity, let's grab the first non-extension video (we don't want to control our PIP camera feed)
    const targetVideo = videos.find(v => !v.classList.contains('input_video') && !v.srcObject);
    
    if (!targetVideo) return;

    switch (action) {
        case 'playpause':
            if (targetVideo.paused) {
                targetVideo.play().catch(console.error);
            } else {
                targetVideo.pause();
            }
            break;
        case 'forward':
            targetVideo.currentTime += 10; // Skip 10 seconds ahead
            break;
        case 'backward':
            targetVideo.currentTime -= 10; // Skip 10 seconds back
            break;
    }
};

/**
 * Helper function to find and click pagination links commonly found on comic sites.
 */
const clickPaginationButton = (keywords: string[]) => {
    // 1. Find all links and buttons
    const clickables = Array.from(document.querySelectorAll('a, button'));
    
    // 2. Search their text content or common classes
    const target = clickables.find(el => {
        const text = (el.textContent || '').toLowerCase();
        const className = (el.className || '');
        if (typeof className !== 'string') return false; // SVGs etc.

        const fullStr = `${text} ${className.toLowerCase()}`;
        return keywords.some(kw => fullStr.includes(kw));
    });

    if (target) {
        // Provide visual feedback if needed, then click
        console.log(`[Gesture Mapping] Element found for keywords ${keywords.join(',')}. Clicking...`);
        (target as HTMLElement).click();
    } else {
        console.log(`[Gesture Mapping] Could not find button for keywords: ${keywords.join(',')}`);
    }
};
