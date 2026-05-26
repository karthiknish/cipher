/** App-level user shape (Better Auth id exposed as `uid`). */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  metadata?: {
    creationTime?: string;
  };
}
