/**
 * Mobile Testing Utilities for Chat System
 * 
 * This file contains utilities to test and validate mobile responsiveness
 * of the chat system across different devices and screen sizes.
 */

export interface DeviceViewport {
    name: string;
    width: number;
    height: number;
    userAgent: string;
    pixelRatio: number;
}

export const MOBILE_DEVICES: DeviceViewport[] = [
    {
        name: 'iPhone SE',
        width: 375,
        height: 667,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2
    },
    {
        name: 'iPhone 12',
        width: 390,
        height: 844,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 3
    },
    {
        name: 'iPhone 14 Pro Max',
        width: 430,
        height: 932,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 3
    },
    {
        name: 'Samsung Galaxy S21',
        width: 360,
        height: 800,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        pixelRatio: 3
    },
    {
        name: 'Google Pixel 6',
        width: 393,
        height: 851,
        userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
        pixelRatio: 2.75
    },
    {
        name: 'iPad Mini',
        width: 768,
        height: 1024,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2
    }
];

export interface TouchTarget {
    element: HTMLElement;
    rect: DOMRect;
    isAccessible: boolean;
    size: { width: number; height: number };
}

/**
 * Validates that all interactive elements meet minimum touch target size (44px)
 */
export function validateTouchTargets(): TouchTarget[] {
    const interactiveSelectors = [
        'button',
        'a',
        'input[type="button"]',
        'input[type="submit"]',
        '[role="button"]',
        '[onclick]',
        '.cursor-pointer'
    ];

    const elements = document.querySelectorAll(interactiveSelectors.join(', '));
    const results: TouchTarget[] = [];

    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        // Check if element is visible
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         computedStyle.visibility !== 'hidden' && 
                         computedStyle.display !== 'none';

        if (isVisible) {
            const minSize = 44;
            const isAccessible = rect.width >= minSize && rect.height >= minSize;
            
            results.push({
                element: element as HTMLElement,
                rect,
                isAccessible,
                size: { width: rect.width, height: rect.height }
            });
        }
    });

    return results;
}

/**
 * Tests swipe gesture functionality
 */
export function testSwipeGestures(): Promise<boolean> {
    return new Promise((resolve) => {
        const testElement = document.querySelector('[data-testid="swipe-container"]') as HTMLElement;
        if (!testElement) {
            console.warn('Swipe test container not found');
            resolve(false);
            return;
        }

        let swipeDetected = false;
        
        // Simulate touch events
        const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({
                identifier: 0,
                target: testElement,
                clientX: 100,
                clientY: 100
            })]
        });

        const touchEnd = new TouchEvent('touchend', {
            changedTouches: [new Touch({
                identifier: 0,
                target: testElement,
                clientX: 200,
                clientY: 100
            })]
        });

        // Listen for navigation changes
        const originalNavigate = window.history.pushState;
        window.history.pushState = function(...args) {
            swipeDetected = true;
            originalNavigate.apply(this, args);
        };

        testElement.dispatchEvent(touchStart);
        setTimeout(() => {
            testElement.dispatchEvent(touchEnd);
            setTimeout(() => {
                window.history.pushState = originalNavigate;
                resolve(swipeDetected);
            }, 100);
        }, 50);
    });
}

/**
 * Validates virtual keyboard handling
 */
export function testVirtualKeyboard(): boolean {
    const inputs = document.querySelectorAll('input, textarea');
    let allInputsValid = true;

    inputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        // iOS requires 16px minimum to prevent zoom
        if (fontSize < 16) {
            console.warn(`Input element has font-size ${fontSize}px, should be at least 16px to prevent zoom on iOS`);
            allInputsValid = false;
        }
    });

    return allInputsValid;
}

/**
 * Tests responsive layout at different breakpoints
 */
export function testResponsiveLayout(device: DeviceViewport): void {
    // This would need to be implemented with actual viewport changes in a testing environment
    console.log(`Testing layout for ${device.name} (${device.width}x${device.height})`);

    // Check if mobile navigation is visible
    const mobileNav = document.querySelector('[data-testid="mobile-navigation"]');
    const desktopNav = document.querySelector('[data-testid="desktop-navigation"]');
    
    if (device.width < 768) {
        if (!mobileNav || mobileNav.classList.contains('hidden')) {
            console.error('Mobile navigation should be visible on mobile devices');
        }
        if (desktopNav && !desktopNav.classList.contains('hidden')) {
            console.error('Desktop navigation should be hidden on mobile devices');
        }
    }
}

/**
 * Comprehensive mobile chat test suite
 */
export async function runMobileChatTests(): Promise<{
    touchTargets: { passed: number; failed: number; details: TouchTarget[] };
    swipeGestures: boolean;
    virtualKeyboard: boolean;
    overallScore: number;
}> {
    console.log('🧪 Running mobile chat tests...');
    
    // Test touch targets
    const touchTargets = validateTouchTargets();
    const touchTargetsPassed = touchTargets.filter(t => t.isAccessible).length;
    const touchTargetsFailed = touchTargets.filter(t => !t.isAccessible).length;
    
    // Test swipe gestures
    const swipeGestures = await testSwipeGestures();
    
    // Test virtual keyboard
    const virtualKeyboard = testVirtualKeyboard();
    
    // Calculate overall score
    const touchScore = touchTargets.length > 0 ? (touchTargetsPassed / touchTargets.length) * 100 : 100;
    const swipeScore = swipeGestures ? 100 : 0;
    const keyboardScore = virtualKeyboard ? 100 : 0;
    const overallScore = (touchScore + swipeScore + keyboardScore) / 3;
    
    const results = {
        touchTargets: {
            passed: touchTargetsPassed,
            failed: touchTargetsFailed,
            details: touchTargets.filter(t => !t.isAccessible)
        },
        swipeGestures,
        virtualKeyboard,
        overallScore
    };
    
    console.log('📊 Mobile test results:', results);
    
    return results;
}

/**
 * Utility to log mobile-specific information
 */
export function logMobileInfo(): void {
    console.log('📱 Mobile Environment Info:', {
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        },
        touchSupport: 'ontouchstart' in window,
        visualViewport: window.visualViewport ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            scale: window.visualViewport.scale
        } : 'Not supported'
    });
}
