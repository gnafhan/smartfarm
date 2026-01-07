import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
