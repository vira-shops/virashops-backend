export default interface PendingSignupRepositoryPort {
  save(phone: string, fullName: string): Promise<void>;
  find(phone: string): Promise<{ fullName: string } | null>;
  delete(phone: string): Promise<void>;
}
