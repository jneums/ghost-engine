import { AuthClient } from '@dfinity/auth-client';
import { SignIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

export class AuthHandler {
  private authClient: AuthClient | null = null;
  private identity: SignIdentity | null = null;
  private principal: Principal | null = null;

  public async initialize() {
    this.authClient = await AuthClient.create();
  }

  public getPrincipal() {
    return this.principal;
  }

  public async login(): Promise<SignIdentity> {
    if (!this.authClient) {
      throw new Error('AuthClient not initialized');
    }

    if (this.identity) {
      return this.identity;
    }

    return new Promise<SignIdentity>((resolve, reject) => {
      this.authClient!.login({
        identityProvider: `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`,
        onSuccess: async () => {
          const identity = this.authClient?.getIdentity();
          if (!identity) {
            reject(new Error('Identity not found'));
            return;
          }
          this.identity = identity as SignIdentity;
          this.principal = this.identity.getPrincipal();
          resolve(this.identity);
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  }
}
