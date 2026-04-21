/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LEADERBOARD_API_URL?: string;
}

declare module '*.txt?raw' {
    const content: string;
    export default content;
}
