/**
 * Player profile types and local storage management
 * Handles player identity (GUID) and display name persistence
 */

export interface PlayerProfile {
    guid: string; // UUID v4
    displayName: string;
    createdAt: number; // Timestamp in milliseconds
}

export const PLAYER_PROFILE_STORAGE_KEY = 'tangelo_player_profile';

/**
 * Generate a UUID v4-like identifier
 * Used for player identity across sessions
 */
function generateGUID(): string {
    const hex = (): string => Math.floor(Math.random() * 16).toString(16);
    const segment = (len: number): string => Array(len).fill(0).map(hex).join('');

    return [
        segment(8),
        segment(4),
        '4' + segment(3), // version 4
        ((Math.random() * 4 | 8).toString(16)) + segment(3), // variant
        segment(12),
    ].join('-');
}

/**
 * Load player profile from local storage
 * Returns null if no profile exists
 */
export function loadPlayerProfile(): PlayerProfile | null {
    try {
        const raw = localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);
        if (!raw) return null;

        const profile = JSON.parse(raw) as PlayerProfile;

        // Validate structure
        if (typeof profile.guid !== 'string' ||
            typeof profile.displayName !== 'string' ||
            typeof profile.createdAt !== 'number') {
            return null;
        }

        return profile;
    } catch (error) {
        console.warn('Failed to load player profile:', error);
        return null;
    }
}

/**
 * Save player profile to local storage
 */
export function savePlayerProfile(profile: PlayerProfile): void {
    try {
        localStorage.setItem(PLAYER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error('Failed to save player profile:', error);
        throw new Error('Could not save profile to local storage');
    }
}

/**
 * Persist a display name update while preserving stable GUID identity.
 */
export function updatePlayerDisplayName(profile: PlayerProfile, displayName: string): PlayerProfile {
    const updated: PlayerProfile = {
        ...profile,
        displayName: displayName.trim(),
    };
    savePlayerProfile(updated);
    return updated;
}

/**
 * Remove local player profile from device storage.
 */
export function clearPlayerProfile(): void {
    try {
        localStorage.removeItem(PLAYER_PROFILE_STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear player profile:', error);
    }
}

/**
 * Create a new player profile with generated GUID
 */
export function createPlayerProfile(displayName: string): PlayerProfile {
    return {
        guid: generateGUID(),
        displayName,
        createdAt: Date.now(),
    };
}

/**
 * Validate display name
 * Returns error message if invalid, undefined if valid
 */
export function validateDisplayName(name: string): string | undefined {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return 'Please enter a name';
    }

    if (trimmed.length > 20) {
        return 'Name must be 20 characters or less';
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    return undefined;
}

export default {
    loadPlayerProfile,
    savePlayerProfile,
    createPlayerProfile,
    updatePlayerDisplayName,
    clearPlayerProfile,
    validateDisplayName,
};
