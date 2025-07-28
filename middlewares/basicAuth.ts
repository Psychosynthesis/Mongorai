import { Request, Response, NextFunction } from 'express';

const SETTED_PASS = process.env.MONGORAI_PASS ?? 'default-pass';

// Расширяем интерфейс Error для добавления свойства status
interface AuthError extends Error {
  status?: number;
}

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authEnabled = process.env.MONGORAI_ENABLE_AUTH === 'true';
  if (!authEnabled) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // Проверка наличия заголовка
  if (!authHeader) {
    return sendUnauthorized(res, next);
  }

  // Проверка формата заголовка
  const [authType, credentials] = authHeader.split(' ');
  if (authType !== 'Basic' || !credentials) {
    return sendUnauthorized(res, next);
  }

  try {
    // Декодирование и проверка учетных данных
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    // Проверка наличия обеих частей
    if (!user || !pass) {
      return sendUnauthorized(res, next);
    }

    // Проверка учетных данных
    if (user === 'mongorai' && pass === SETTED_PASS) {
      return next();
    }

    return sendUnauthorized(res, next);
  } catch (error) {
    // Специальная обработка ошибок декодирования
    const err = new Error('Invalid authentication format') as AuthError;
    err.status = 400;
    return next(err);
  }
};

// Вспомогательная функция для отправки ошибки 401
function sendUnauthorized(res: Response, next: NextFunction) {
  // Если заголовки уже отправлены - передаем ошибку дальше
  if (res.headersSent) {
    const err = new Error('Authentication required') as AuthError;
    err.status = 401;
    return next(err);
  }

  // Устанавливаем заголовки и отправляем ошибку
  res.setHeader('WWW-Authenticate', 'Basic');
  const err = new Error('You are not authenticated') as AuthError;
  err.status = 401;
  return next(err);
}
