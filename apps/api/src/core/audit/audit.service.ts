import { prisma } from '@reservy/database';

export interface RecordAuditParams {
  organizationId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(params: RecordAuditParams) {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorUserId: params.actorUserId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : '{}',
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}

export const auditService = new AuditService();
