import { 
  users, profiles, requests, files, audits,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type Request, type InsertRequest,
  type FileRecord, type InsertFile,
  type Audit, type InsertAudit,
  type CreateRequestInput, type UpdateRequestInput,
  type CreateAuditInput
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  
  // Requests
  getRequest(id: number): Promise<Request | undefined>;
  getRequests(userId?: string, role?: string): Promise<(Request & { user: User, auditor: User | null })[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, request: UpdateRequestInput): Promise<Request>;
  
  // Files
  createFile(file: InsertFile): Promise<FileRecord>;
  getFilesByRequestId(requestId: number): Promise<FileRecord[]>;
  
  // Audits
  getAuditByRequestId(requestId: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(requestId: number, audit: Partial<InsertAudit>): Promise<Audit>;
  
  // Users (helper for assignment)
  getAuditors(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(profile: InsertProfile): Promise<Profile> {
    const [existing] = await db.select().from(profiles).where(eq(profiles.userId, profile.userId));
    if (existing) {
      const [updated] = await db.update(profiles)
        .set(profile)
        .where(eq(profiles.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(profiles).values(profile).returning();
    return created;
  }

  // Requests
  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async getRequests(userId?: string, role?: string): Promise<(Request & { user: User, auditor: User | null })[]> {
    let query = db.select({
      request: requests,
      user: users,
      auditor: users // join users again for auditor? No, drizzle handles this differently or we manual join
    })
    .from(requests)
    .innerJoin(users, eq(requests.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.userId)); // To check role if needed, but userId/role param handles filter

    // For simplicity in list view, we just need the data. 
    // Drizzle relations are easier for single fetch, but for list:
    
    // Let's rely on basic query and simple manual join or fetch.
    // Actually, let's use the relations API or simple where clauses.
    
    const conditions = [];
    if (role === 'legal_entity' && userId) {
      conditions.push(eq(requests.userId, userId));
    } else if (role === 'auditor' && userId) {
      conditions.push(eq(requests.auditorId, userId));
    }
    // Admin sees all, so no condition added if role is admin

    const rows = await db.query.requests.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true,
        auditor: true,
      },
      orderBy: [desc(requests.createdAt)]
    });
    
    // Map to flat structure or keep as is? The return type expects intersection.
    // Drizzle query result: { ...request, user: User, auditor: User | null }
    return rows as (Request & { user: User, auditor: User | null })[];
  }

  async createRequest(req: InsertRequest): Promise<Request> {
    const [created] = await db.insert(requests).values(req).returning();
    return created;
  }

  async updateRequest(id: number, req: UpdateRequestInput): Promise<Request> {
    const [updated] = await db.update(requests)
      .set({ ...req, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return updated;
  }

  // Files
  async createFile(file: InsertFile): Promise<FileRecord> {
    const [created] = await db.insert(files).values(file).returning();
    return created;
  }

  async getFilesByRequestId(requestId: number): Promise<FileRecord[]> {
    return await db.select().from(files).where(eq(files.requestId, requestId));
  }

  // Audits
  async getAuditByRequestId(requestId: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.requestId, requestId));
    return audit;
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [created] = await db.insert(audits).values(audit).returning();
    return created;
  }

  async updateAudit(requestId: number, updates: Partial<InsertAudit>): Promise<Audit> {
    const [updated] = await db.update(audits)
      .set(updates)
      .where(eq(audits.requestId, requestId))
      .returning();
    return updated;
  }

  // Helpers
  async getAuditors(): Promise<User[]> {
    // Join users and profiles where role = auditor
    const rows = await db.select({ user: users })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(profiles.role, 'auditor'));
    return rows.map(r => r.user);
  }
}

export const storage = new DatabaseStorage();
