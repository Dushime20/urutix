import { Controller, Post, Body, Param } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post(':type')
  async triggerWorkflow(@Param('type') type: string, @Body() payload: any) {
    return this.workflowService.handleWorkflow(type, payload);
  }
}
