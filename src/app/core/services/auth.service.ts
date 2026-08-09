import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/firebase.config';
import { AccountService } from './account.service';
import { PreferencesService } from './preferences.service';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly preferencesService = inject(PreferencesService);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _loading = signal(true);
  private _initialized = false;

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = () => this._currentUser() !== null;

  /**
   * Initialize the Firebase auth state listener. Called once from APP_INITIALIZER;
   * must always resolve (never reject) so bootstrap doesn't white-screen.
   */
  initialize(): Promise<void> {
    if (this._initialized) return Promise.resolve();
    this._initialized = true;

    return new Promise(resolve => {
      onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          this._currentUser.set(this.toUser(firebaseUser));
          this.preferencesService.load();
        } else {
          this._currentUser.set(null);
        }
        this._loading.set(false);
        resolve();
      });
    });
  }

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async registerWithEmail(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this._currentUser.set(null);
    this.accountService.reset();
    this.preferencesService.reset();
    this.router.navigate(['/login']);
  }

  private toUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
    };
  }
}
