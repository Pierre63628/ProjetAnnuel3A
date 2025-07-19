// This file extends Express types to avoid TypeScript errors
import { Express } from 'express';

declare global {
  namespace Express {
    // Add any custom properties to the Request interface
    interface Request {
      user?: any;
    }
  }
}

// This is needed to make this file a module
export {};
