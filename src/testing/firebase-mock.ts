import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Fresh set of firebase/auth mock functions for `jest.mock('firebase/auth', () => buildFirebaseAuthMock())`.
 * Must be called from the jest.mock() factory (not shared across spec files) so each
 * spec file's module registry gets its own independent mocks.
 */
export function buildFirebaseAuthMock() {
  return {
    getAuth: jest.fn(() => ({ currentUser: null })),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn((_auth: unknown, callback: (user: FirebaseUser | null) => void) => {
      callback(null);
      return jest.fn();
    }),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    GoogleAuthProvider: jest.fn(),
  };
}

export function mockFirebaseUser(overrides: Partial<FirebaseUser> = {}): FirebaseUser {
  return {
    uid: 'uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    ...overrides,
  } as unknown as FirebaseUser;
}
