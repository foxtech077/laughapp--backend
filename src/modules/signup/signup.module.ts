import { Module } from '@nestjs/common';
import { SignupService } from './signup.service';

@Module({
  providers: [SignupService],
  exports: [SignupService],
})
export class SignupModule {}
