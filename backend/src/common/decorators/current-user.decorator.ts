import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'STUDENT';
  studentId?: number;
  professorId?: number;
  firstName?: string;
  lastName?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
