declare global {
    namespace NodeJS {
        interface ProcessEnv {
            port: string;
            webhook: string;
        }
    }
}

export {}