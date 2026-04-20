import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    loadPlayerProfile,
    savePlayerProfile,
    createPlayerProfile,
    clearPlayerProfile,
    updatePlayerDisplayName,
    validateDisplayName,
} from '../utils/playerProfile';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('Player Profile', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('createPlayerProfile', () => {
        it('should create a new profile with generated GUID', () => {
            const profile = createPlayerProfile('TestPlayer');

            expect(profile.displayName).toBe('TestPlayer');
            expect(profile.guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            expect(profile.createdAt).toBeGreaterThan(0);
            expect(typeof profile.createdAt).toBe('number');
        });

        it('should create profiles with unique GUIDs', () => {
            const profile1 = createPlayerProfile('Player1');
            const profile2 = createPlayerProfile('Player2');

            expect(profile1.guid).not.toBe(profile2.guid);
        });

        it('should set createdAt timestamp', () => {
            const before = Date.now();
            const profile = createPlayerProfile('TestPlayer');
            const after = Date.now();

            expect(profile.createdAt).toBeGreaterThanOrEqual(before);
            expect(profile.createdAt).toBeLessThanOrEqual(after);
        });
    });

    describe('validateDisplayName', () => {
        it('should accept valid names', () => {
            expect(validateDisplayName('Alice')).toBeUndefined();
            expect(validateDisplayName('Bob-Smith')).toBeUndefined();
            expect(validateDisplayName('Player_123')).toBeUndefined();
        });

        it('should reject empty names', () => {
            const error = validateDisplayName('');
            expect(error).toBe('Please enter a name');
        });

        it('should reject names with only whitespace', () => {
            const error = validateDisplayName('   ');
            expect(error).toBe('Please enter a name');
        });

        it('should reject names longer than 20 characters', () => {
            const error = validateDisplayName('This is a very long name');
            expect(error).toBe('Name must be 20 characters or less');
        });

        it('should accept names exactly 20 characters', () => {
            const name20 = 'a'.repeat(20);
            expect(validateDisplayName(name20)).toBeUndefined();
        });

        it('should reject names with invalid characters', () => {
            const error1 = validateDisplayName('Player@123');
            expect(error1).toBe('Name can only contain letters, numbers, spaces, hyphens, and underscores');

            const error2 = validateDisplayName('Player!');
            expect(error2).toBe('Name can only contain letters, numbers, spaces, hyphens, and underscores');
        });

        it('should accept names with spaces', () => {
            expect(validateDisplayName('Alice Smith')).toBeUndefined();
        });
    });

    describe('savePlayerProfile', () => {
        it('should save profile to localStorage', () => {
            const profile = createPlayerProfile('TestPlayer');
            savePlayerProfile(profile);

            const stored = localStorage.getItem('boggle_player_profile');
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored!);
            expect(parsed.guid).toBe(profile.guid);
            expect(parsed.displayName).toBe(profile.displayName);
            expect(parsed.createdAt).toBe(profile.createdAt);
        });

        it('should overwrite existing profile', () => {
            const profile1 = createPlayerProfile('Player1');
            savePlayerProfile(profile1);

            const profile2 = createPlayerProfile('Player2');
            savePlayerProfile(profile2);

            const stored = localStorage.getItem('boggle_player_profile');
            const parsed = JSON.parse(stored!);
            expect(parsed.displayName).toBe('Player2');
            expect(parsed.guid).toBe(profile2.guid);
        });
    });

    describe('loadPlayerProfile', () => {
        it('should load profile from localStorage', () => {
            const profile = createPlayerProfile('TestPlayer');
            savePlayerProfile(profile);

            const loaded = loadPlayerProfile();
            expect(loaded).not.toBeNull();
            expect(loaded!.guid).toBe(profile.guid);
            expect(loaded!.displayName).toBe('TestPlayer');
            expect(loaded!.createdAt).toBe(profile.createdAt);
        });

        it('should return null if no profile exists', () => {
            const loaded = loadPlayerProfile();
            expect(loaded).toBeNull();
        });

        it('should return null if stored data is invalid', () => {
            localStorage.setItem('boggle_player_profile', 'invalid json');
            const loaded = loadPlayerProfile();
            expect(loaded).toBeNull();
        });

        it('should return null if profile is missing required fields', () => {
            localStorage.setItem('boggle_player_profile', JSON.stringify({ guid: 'test' }));
            const loaded = loadPlayerProfile();
            expect(loaded).toBeNull();
        });

        it('should handle corrupted data gracefully', () => {
            localStorage.setItem('boggle_player_profile', '{ corrupted json');
            const loaded = loadPlayerProfile();
            expect(loaded).toBeNull();
        });
    });

    describe('Profile Persistence', () => {
        it('should persist and reload profile correctly', () => {
            const originalProfile = createPlayerProfile('Alice');
            savePlayerProfile(originalProfile);

            const loadedProfile = loadPlayerProfile();
            expect(loadedProfile).toEqual(originalProfile);
        });

        it('should maintain profile across multiple save/load cycles', () => {
            const profile = createPlayerProfile('Bob');
            savePlayerProfile(profile);

            const loaded1 = loadPlayerProfile();
            const loaded2 = loadPlayerProfile();

            expect(loaded1).toEqual(loaded2);
            expect(loaded1?.guid).toBe(profile.guid);
        });

        it('updates display name while preserving GUID identity', () => {
            const profile = createPlayerProfile('InitialName');
            savePlayerProfile(profile);

            const updated = updatePlayerDisplayName(profile, 'Renamed');
            const loaded = loadPlayerProfile();

            expect(updated.guid).toBe(profile.guid);
            expect(updated.displayName).toBe('Renamed');
            expect(loaded?.guid).toBe(profile.guid);
            expect(loaded?.displayName).toBe('Renamed');
        });

        it('clears local profile data', () => {
            const profile = createPlayerProfile('Alice');
            savePlayerProfile(profile);

            clearPlayerProfile();

            expect(loadPlayerProfile()).toBeNull();
        });
    });
});
