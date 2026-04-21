import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headerUserId = request.headers['x-user-id'];
    const headerUserType = request.headers['x-user-type'];
    const user = request.user ?? {
      id: Array.isArray(headerUserId) ? headerUserId[0] : headerUserId,
      userType: Array.isArray(headerUserType) ? headerUserType[0] : headerUserType,
    };

    if (!user || (!user.id && !user.userType)) {
      return null;
    }

    return data ? user[data] : user;
  },
);
