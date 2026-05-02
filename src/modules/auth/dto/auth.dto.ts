export class SendOtpDto {
  phoneNumber: string;
}

export class VerifyOtpDto {
  phoneNumber: string;
  otp: string;
  source?: {
    videoId?: string;
    creatorId?: string;
    inviteId?: string;
  };
}

export class OtpResponseDto {
  success: boolean;
  message: string;
}

export class AuthResponseDto {
  success: boolean;
  isNewUser: boolean;
  user: {
    id: string;
    phoneNumber: string;
    userType: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    isOnTrial: boolean;
    trialEndsAt?: string;
    coinBalance: number;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}