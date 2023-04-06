import User from "../../models/user";
import ADA from "../../ADA";

declare global {
    namespace Express {
        interface Request {
            user?: User;
            ada?: ADA;
        }
        interface Response {
            unauthorized(message: string): void;
            forbidden(message: string): void;
            malformed(): void;
        }
    }
}

declare module 'express-session' {
    interface SessionData {
        user: string;
    }
}