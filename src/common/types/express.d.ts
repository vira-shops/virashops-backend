export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        getId(): number;
        getPhone(): string;
        getRoles(): string[];
        hasRole(role: string): boolean;
      };
    }
  }
}
