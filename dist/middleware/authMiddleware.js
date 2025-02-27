"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const tokensDev = ["c498967a50d7b2587229403cd4ac58cf"];
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new Error();
        }
        if (!tokensDev.includes(token)) {
            return res.status(401).json({ error: "Invalid Token" });
        }
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Please authenticate" });
    }
};
exports.authMiddleware = authMiddleware;
