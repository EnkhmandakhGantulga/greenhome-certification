import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertRequestSchema, 
  insertFileSchema, 
  insertAuditSchema,
  requests,
  files,
  audits,
  profiles,
  requestStatusEnum
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  // Profiles (Roles)
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const, // Upsert
      path: '/api/profiles',
      input: insertProfileSchema.omit({ userId: true }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    }
  },

  // Requests
  requests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests',
      input: z.object({
        status: z.enum(requestStatusEnum).optional(),
        role: z.enum(['legal_entity', 'admin', 'auditor']).optional(), // Filter by role view
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof requests.$inferSelect & { user: any, auditor: any }>()), // Include relations
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/requests/:id',
      responses: {
        200: z.custom<typeof requests.$inferSelect & { user: any, auditor: any, files: any[], audit: any }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: insertRequestSchema.omit({ userId: true, auditorId: true, status: true, priceQuote: true, adminComment: true }),
      responses: {
        201: z.custom<typeof requests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/requests/:id',
      input: insertRequestSchema.partial(),
      responses: {
        200: z.custom<typeof requests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Files
  files: {
    create: {
      method: 'POST' as const,
      path: '/api/files',
      input: insertFileSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof files.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/requests/:requestId/files',
      responses: {
        200: z.array(z.custom<typeof files.$inferSelect>()),
      },
    }
  },

  // Audits
  audits: {
    create: {
      method: 'POST' as const,
      path: '/api/requests/:requestId/audit',
      input: insertAuditSchema.omit({ requestId: true, auditorId: true }),
      responses: {
        201: z.custom<typeof audits.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/requests/:requestId/audit',
      input: insertAuditSchema.partial(),
      responses: {
        200: z.custom<typeof audits.$inferSelect>(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
