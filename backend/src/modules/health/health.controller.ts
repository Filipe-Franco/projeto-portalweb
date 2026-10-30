import type { Request, Response } from 'express';

export function healthController(req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'portalweb-api',
  });
}
