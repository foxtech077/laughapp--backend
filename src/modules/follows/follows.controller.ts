import { Controller, Get, Post, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { FollowDto, FindFollowsDto } from './dto/follow.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('follows')
@Controller('follows')
@ApiBearerAuth()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'Followed successfully' })
  @ApiResponse({ status: 409, description: 'Already following' })
  create(@CurrentUser('id') userId: string, @Body() dto: FollowDto) {
    return this.followsService.follow(userId, dto);
  }

  @Delete(':followingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'Unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'Not following' })
  unfollow(
    @CurrentUser('id') userId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
  ) {
    return this.followsService.unfollow(userId, followingId);
  }

  @Get()
  @ApiOperation({ summary: 'Get follows with filters' })
  @ApiResponse({ status: 200, description: 'List of follows' })
  findAll(@Query() dto: FindFollowsDto) {
    return this.followsService.findAll(dto);
  }

  @Get('user/:userId/followers')
  @Public()
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followsService.getFollowers(userId, page, limit);
  }

  @Get('user/:userId/following')
  @Public()
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiResponse({ status: 200, description: 'List of following' })
  getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followsService.getFollowing(userId, page, limit);
  }

  @Get('check/:followingId')
  @ApiOperation({ summary: 'Check if current user follows a user' })
  @ApiResponse({ status: 200, description: 'Follow status' })
  checkFollow(
    @CurrentUser('id') userId: string,
    @Param('followingId', ParseUUIDPipe) followingId: string,
  ) {
    return this.followsService.isFollowing(userId, followingId);
  }
}
