import { Request, Response, NextFunction } from 'express';

const MONGORAI_READ_ONLY_MODE = process.env.MONGORAI_READ_ONLY_MODE === 'true';

export function writeEnabled(_: Request, res: Response, next: NextFunction) {
    if (MONGORAI_READ_ONLY_MODE) {
        // METHOD not allowed
        res.status(405);

        return res.json({
          ok:      false,
          message: "You can't do this in read-only mode",
        });
    } else {
        next();
    }
}
