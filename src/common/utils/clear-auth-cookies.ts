import { Response } from 'express';

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
}
    