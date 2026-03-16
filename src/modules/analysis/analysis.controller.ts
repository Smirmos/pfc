import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { SaveInputsDto } from './dto/save-inputs.dto';
import { ListAnalysesDto } from './dto/list-analyses.dto';

type AuthRequest = FastifyRequest & { user: { id: string } };

@Controller('analyses')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  // ── Case CRUD ──────────────────────────────────────────────────────

  @Get()
  findAll(@Req() req: AuthRequest, @Query() query: ListAnalysesDto) {
    return this.analysisService.findAll(req.user.id, query);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateAnalysisDto) {
    return this.analysisService.create(req.user.id, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.analysisService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnalysisDto,
  ) {
    return this.analysisService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async softDelete(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.analysisService.softDelete(req.user.id, id);
    return { deleted: true };
  }

  @Post(':id/duplicate')
  duplicate(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.analysisService.duplicate(req.user.id, id);
  }

  // ── Inputs ─────────────────────────────────────────────────────────

  @Get(':id/inputs')
  getLatestInputs(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analysisService.getLatestInputs(req.user.id, id);
  }

  @Put(':id/inputs')
  saveInputs(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveInputsDto,
  ) {
    return this.analysisService.saveInputs(req.user.id, id, dto);
  }

  // ── Stubs (future tickets) ────────────────────────────────────────

  @Post(':id/run')
  run(@Param('id', ParseUUIDPipe) _id: string) {
    throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get(':id/results/latest')
  getLatestResults(@Param('id', ParseUUIDPipe) _id: string) {
    throw new HttpException('No results found', HttpStatus.NOT_FOUND);
  }

  @Get(':id/scenarios')
  getScenarios(@Param('id', ParseUUIDPipe) _id: string) {
    return [];
  }

  // ── Files ─────────────────────────────────────────────────────────

  @Post(':id/files')
  getUploadUrl(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analysisService.getUploadUrl(req.user.id, id);
  }

  @Post(':id/extract')
  queueExtraction(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analysisService.queueExtraction(req.user.id, id);
  }

  // ── Status transitions ────────────────────────────────────────────

  @Post(':id/activate')
  activate(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.analysisService.activate(req.user.id, id);
  }

  @Post(':id/deactivate')
  deactivate(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.analysisService.deactivate(req.user.id, id);
  }
}
