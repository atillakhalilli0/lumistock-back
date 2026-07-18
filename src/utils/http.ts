import { Request } from "express";

export type IdRequest = Request<{ id: string }>;
export type CustomerRequest = Request<{ customerId: string }>;
export type ProductRequest = Request<{ productId: string }>;
export type OrderRequest = Request<{ idOrOrderNumber: string }>;
export type ReportRequest = Request<{ type: string }>;