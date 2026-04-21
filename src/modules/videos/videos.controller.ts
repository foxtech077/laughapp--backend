import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import {
  CreateVideoDto,
  UpdateVideoDto,
  FindVideosDto,
  VideoResponseDto,
  PaginatedVideosResponseDto,
} from './dto/video.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserType } from '@prisma/client';

@ApiTags('videos')
@Controller('videos')
@ApiBearerAuth()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @Roles(UserType.CREATOR, UserType.ADMIN)
  @ApiOperation({ summary: 'Create a new video' })
  @ApiResponse({ status: 201, description: 'Video created', type: VideoResponseDto })
  @ApiResponse({ status: 403, description: 'Only creators can publish videos' })
  @ApiResponse({ status: 400, description: 'Publishing quota exceeded' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVideoDto) {
    return this.videosService.create(userId, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all published videos with pagination' })
  @ApiResponse({ status: 200, description: 'List of videos', type: PaginatedVideosResponseDto })
  findAll(@Query() dto: FindVideosDto) {
    return this.videosService.findAll(dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiParam({ name: 'id', description: 'Video ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Video found', type: VideoResponseDto })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserType.CREATOR, UserType.ADMIN)
  @ApiOperation({ summary: 'Update video' })
  @ApiParam({ name: 'id', description: 'Video ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Video updated', type: VideoResponseDto })
  @ApiResponse({ status: 403, description: 'Not your video' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videosService.update(id, userId, dto);
  }

  @Post(':id/publish')
  @Roles(UserType.CREATOR, UserType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a processing video' })
  @ApiParam({ name: 'id', description: 'Video ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Video published', type: VideoResponseDto })
  @ApiResponse({ status: 400, description: 'Video not in processing state' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.videosService.publish(id, userId);
  }

  @Delete(':id')
  @Roles(UserType.CREATOR, UserType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete video (soft delete)' })
  @ApiParam({ name: 'id', description: 'Video ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Video deleted' })
  @ApiResponse({ status: 403, description: 'Not your video' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.videosService.remove(id, userId);
  }

  @Post(':id/view')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a video view' })
  @ApiResponse({ status: 200, description: 'View recorded' })
  recordView(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.recordView(id);
  }
}
