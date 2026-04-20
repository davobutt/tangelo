import { describe, expect, it } from 'vitest';
import { createHighScoreStore } from '../utils/highScoreStorage';

class MemoryStorage implements Storage {
    private readonly map = new Map<string, string>();

    get length(): number {
        return this.map.size;
    }

    clear(): void {
        this.map.clear();
    }

    getItem(key: string): string | null {
        return this.map.has(key) ? this.map.get(key)! : null;
    }

    key(index: number): string | null {
        return Array.from(this.map.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.map.delete(key);
    }

    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
}

class ThrowingStorage extends MemoryStorage {
    override getItem(_key: string): string | null {
        throw new Error('storage blocked');
    }

    override setItem(_key: string, _value: string): void {
        throw new Error('storage blocked');
    }
}

describe('createHighScoreStore', () => {
    it('migrates legacy high score key into endless-mode key', () => {
        const storage = new MemoryStorage();
        storage.setItem('tangelo.highScore', '14');

        const store = createHighScoreStore(storage);
        expect(store.get()).toBe(14);
        expect(storage.getItem('tangelo.endless.highScore')).toBe('14');
    });

    it('persists high score in storage when available', () => {
        const storage = new MemoryStorage();
        const store = createHighScoreStore(storage);

        expect(store.get()).toBe(0);

        store.set(8);
        expect(store.get()).toBe(8);

        const nextInstance = createHighScoreStore(storage);
        expect(nextInstance.get()).toBe(8);
    });

    it('never decreases the saved high score', () => {
        const storage = new MemoryStorage();
        const store = createHighScoreStore(storage);

        store.set(12);
        store.set(5);

        expect(store.get()).toBe(12);
    });

    it('falls back safely when storage is unavailable', () => {
        const store = createHighScoreStore(null);

        store.set(7);
        expect(store.get()).toBe(7);
    });

    it('clears local high score state and storage keys', () => {
        const storage = new MemoryStorage();
        const store = createHighScoreStore(storage);

        store.set(21);
        expect(store.get()).toBe(21);

        store.clear();

        expect(store.get()).toBe(0);
        expect(storage.getItem('tangelo.endless.highScore')).toBeNull();
        expect(storage.getItem('tangelo.highScore')).toBeNull();
    });

    it('remains playable when storage throws', () => {
        const store = createHighScoreStore(new ThrowingStorage());

        store.set(11);
        expect(store.get()).toBe(11);
    });
});
