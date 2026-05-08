/**
 * Common Utilities
 * Production-ready helper functions and utilities
 */

import { Alert, AlertButton } from 'react-native';

/**
 * Show error alert
 */
export function showErrorAlert(
    title: string,
    message: string,
    onDismiss?: () => void
) {
    const buttons: AlertButton[] = [
        {
            text: 'OK',
            onPress: onDismiss,
        },
    ];

    Alert.alert(title, message, buttons);
}

/**
 * Show success alert
 */
export function showSuccessAlert(
    title: string,
    message: string,
    onDismiss?: () => void
) {
    const buttons: AlertButton[] = [
        {
            text: 'OK',
            onPress: onDismiss,
        },
    ];

    Alert.alert(title, message, buttons);
}

/**
 * Show confirmation alert
 */
export function showConfirmAlert(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
) {
    const buttons: AlertButton[] = [
        {
            text: 'Cancel',
            onPress: onCancel,
            style: 'cancel',
        },
        {
            text: 'Confirm',
            onPress: onConfirm,
            style: 'destructive',
        },
    ];

    Alert.alert(title, message, buttons);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
    isStrong: boolean;
    feedback: string[];
} {
    const feedback: string[] = [];

    if (password.length < 8) {
        feedback.push('At least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        feedback.push('One uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        feedback.push('One lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        feedback.push('One number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
        feedback.push('One special character (!@#$%^&*)');
    }

    return {
        isStrong: feedback.length === 0,
        feedback,
    };
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time to readable string (HH:MM)
 */
export function formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format datetime to readable string
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return `${formatDate(dateObj)} at ${formatTime(dateObj)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId as any);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let lastRun = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastRun >= limit) {
            func(...args);
            lastRun = now;
        }
    };
}

/**
 * Capitalize string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

/**
 * Check if app is in development mode
 */
export const isDevelopment = __DEV__;

/**
 * Log with environment prefix
 */
export function log(tag: string, message: any, data?: any) {
    if (isDevelopment) {
        console.log(`[${tag}]`, message, data || '');
    }
}

/**
 * Error log with environment prefix
 */
export function logError(tag: string, error: any) {
    console.error(`[ERROR ${tag}]`, error);
}
