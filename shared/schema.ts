import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// User Roles Profile
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  role: text("role", { enum: ["legal_entity", "admin", "auditor"] }).default("legal_entity").notNull(),
  organizationName: text("organization_name"), // For legal entities
  phoneNumber: text("phone_number"),
  address: text("address"),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

// Requests
export const requestStatusEnum = [
  "submitted", // Initial submit
  "quoted", // Admin gave price
  "contract_signed", // Contract uploaded/signed
  "files_uploaded", // User uploaded project files
  "auditor_assigned", // Admin assigned auditor
  "audit_in_progress", // Auditor working
  "audit_submitted", // Auditor submitted conclusion
  "approved", // Admin approved
  "rejected", // Admin rejected
  "certificate_issued" // Final state
] as const;

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  auditorId: varchar("auditor_id").references(() => users.id), // Assigned auditor
  
  status: text("status", { enum: requestStatusEnum }).default("submitted").notNull(),
  
  // Request details
  projectType: text("project_type").notNull(),
  projectArea: text("project_area"), // e.g. m2
  location: text("location"),
  description: text("description"),
  
  // Admin fields
  priceQuote: integer("price_quote"),
  adminComment: text("admin_comment"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const requestsRelations = relations(requests, ({ one, many }) => ({
  user: one(users, {
    fields: [requests.userId],
    references: [users.id],
    relationName: "requester"
  }),
  auditor: one(users, {
    fields: [requests.auditorId],
    references: [users.id],
    relationName: "auditor"
  }),
  files: many(files),
  audit: one(audits, {
    fields: [requests.id],
    references: [audits.requestId],
  }),
}));

// Files (Project files, Contracts, Certificates, etc.)
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  userId: varchar("user_id").notNull().references(() => users.id), // Uploader
  
  url: text("url").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["project_file", "contract", "audit_report", "certificate", "other"] }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const filesRelations = relations(files, ({ one }) => ({
  request: one(requests, {
    fields: [files.requestId],
    references: [requests.id],
  }),
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
}));

// Audits
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id).unique(),
  auditorId: varchar("auditor_id").notNull().references(() => users.id),
  
  checklistData: jsonb("checklist_data").$type<Record<string, boolean | string>>(),
  conclusion: text("conclusion"),
  
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const auditsRelations = relations(audits, ({ one }) => ({
  request: one(requests, {
    fields: [audits.requestId],
    references: [requests.id],
  }),
  auditor: one(users, {
    fields: [audits.auditorId],
    references: [users.id],
  }),
}));

// Zod Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, createdAt: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, submittedAt: true });

// Explicit Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type FileRecord = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

export type RequestStatus = typeof requestStatusEnum[number];

export type CreateRequestInput = Omit<InsertRequest, "userId" | "auditorId" | "status" | "priceQuote" | "adminComment">;
export type UpdateRequestInput = Partial<InsertRequest>;

export type CreateAuditInput = Omit<InsertAudit, "auditorId">;

