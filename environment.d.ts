declare global {
    namespace NodeJS {
        interface ProcessEnv {
            port: string;
            webhook: string;
            database: string;
            user: string;
            password: string;
            host: string;
        }
    }
}

export {}