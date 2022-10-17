import User from "../../models/user";
import WAP from "../../WAP";

declare global {
    namespace Express {
        interface Request {
            user?: User;
            wap?: WAP;
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