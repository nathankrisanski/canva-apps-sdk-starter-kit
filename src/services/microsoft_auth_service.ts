import { auth } from "@canva/user";
import type { AccessTokenResponse } from "@canva/user";

const oauth = auth.initOauth();
// Request OpenID Connect scopes to get user profile information
const scope = new Set(["openid", "profile", "email"]);

interface UserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

interface MicrosoftAuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  error: string | null;
  loading: boolean;
}

class MicrosoftAuthService {
  private static instance: MicrosoftAuthService;
  private state: MicrosoftAuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    error: null,
    loading: true,
  };
  private listeners: ((state: MicrosoftAuthState) => void)[] = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): MicrosoftAuthService {
    if (!MicrosoftAuthService.instance) {
      MicrosoftAuthService.instance = new MicrosoftAuthService();
    }
    return MicrosoftAuthService.instance;
  }

  subscribe(listener: (state: MicrosoftAuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private setState(updates: Partial<MicrosoftAuthState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private async initialize(): Promise<void> {
    try {
      console.log("[MicrosoftAuthService] Initializing...");
      this.setState({ loading: true, error: null });
      await this.checkExistingAuth();
    } catch (error) {
      console.error("[MicrosoftAuthService] Initialization error:", error);
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
    }
  }

  private async checkExistingAuth(): Promise<void> {
    try {
      console.log("[MicrosoftAuthService] Checking for existing auth...");
      const tokenResponse = await oauth.getAccessToken({
        scope,
        forceRefresh: false,
      });

      if (tokenResponse && tokenResponse.token) {
        console.log("[MicrosoftAuthService] Found existing token, user is authenticated");
        const userProfile = this.extractUserFromToken(tokenResponse.token);

        this.setState({
          loading: false,
          error: null,
          isAuthenticated: true,
          accessToken: tokenResponse.token,
          user: userProfile,
        });
      } else {
        console.log("[MicrosoftAuthService] No existing token found, user needs to authenticate");
        this.setState({
          loading: false,
          error: null,
          isAuthenticated: false,
          user: null,
          accessToken: null,
        });
      }
    } catch (error) {
      console.log("[MicrosoftAuthService] Error checking auth (user not authenticated):", error);
      this.setState({
        loading: false,
        error: null,
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
    }
  }

  async login(): Promise<void> {
    try {
      this.setState({ loading: true, error: null });

      console.log("[MicrosoftAuthService] Requesting authorization...");
      const authorizeResponse = await oauth.requestAuthorization({ scope });
      console.log("[MicrosoftAuthService] Authorization response:", authorizeResponse);

      if (authorizeResponse.status === "completed") {
        console.log("[MicrosoftAuthService] Authorization completed, retrieving token...");
        await this.retrieveAndSetToken({ forceRefresh: true });
      } else if (authorizeResponse.status === "aborted") {
        console.log("[MicrosoftAuthService] Authorization was aborted by user");
        this.setState({
          loading: false,
          error: "Authentication was cancelled",
          isAuthenticated: false,
          user: null,
          accessToken: null,
        });
      } else {
        console.log("[MicrosoftAuthService] Unexpected authorization status:", authorizeResponse.status);
        this.setState({
          loading: false,
          error: null,
          isAuthenticated: false,
          user: null,
          accessToken: null,
        });
      }
    } catch (error) {
      console.error("[MicrosoftAuthService] Login error:", error);
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Login failed",
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
      throw error;
    }
  }

  private async retrieveAndSetToken({
    forceRefresh = false,
  } = {}): Promise<void> {
    try {
      console.log("[MicrosoftAuthService] Retrieving access token...");
      const accessTokenResponse = await oauth.getAccessToken({
        scope,
        forceRefresh,
      });
      console.log("[MicrosoftAuthService] Full access token response:", accessTokenResponse);
      console.log("[MicrosoftAuthService] Response keys:", accessTokenResponse ? Object.keys(accessTokenResponse) : 'null');

      if (!accessTokenResponse || !accessTokenResponse.token) {
        console.error("[MicrosoftAuthService] No access token received in response");
        throw new Error("No access token received. Please ensure OAuth is configured in Canva Developer Portal.");
      }

      const token = accessTokenResponse.token;
      console.log("[MicrosoftAuthService] Token received successfully");

      // Decode JWT token to extract user info (JWT tokens are base64 encoded JSON)
      const userProfile = this.extractUserFromToken(token);

      console.log("[MicrosoftAuthService] Setting authenticated state with user:", userProfile);
      this.setState({
        loading: false,
        error: null,
        isAuthenticated: true,
        accessToken: token,
        user: userProfile,
      });
      console.log("[MicrosoftAuthService] Authentication successful!");
    } catch (error) {
      console.error("[MicrosoftAuthService] Error retrieving token:", error);
      throw error;
    }
  }

  private extractUserFromToken(token: string): UserProfile {
    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn("[MicrosoftAuthService] Invalid JWT format, using default user");
        return this.getDefaultUser();
      }

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      console.log("[MicrosoftAuthService] Decoded token payload:", payload);

      // Extract user information from Azure AD token claims
      return {
        id: payload.oid || payload.sub || "unknown-user",
        displayName: payload.name || payload.preferred_username || "User",
        mail: payload.email || payload.preferred_username || "",
        userPrincipalName: payload.preferred_username || payload.email || payload.upn || "",
      };
    } catch (error) {
      console.error("[MicrosoftAuthService] Error decoding token:", error);
      return this.getDefaultUser();
    }
  }

  private getDefaultUser(): UserProfile {
    return {
      id: "microsoft-user",
      displayName: "Microsoft User",
      mail: "",
      userPrincipalName: "user@microsoft.com",
    };
  }

  async logout(): Promise<void> {
    try {
      this.setState({ loading: true, error: null });

      await oauth.deauthorize();

      this.setState({
        loading: false,
        error: null,
        isAuthenticated: false,
        user: null,
        accessToken: null,
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Logout failed",
      });
      throw error;
    }
  }

  getState(): MicrosoftAuthState {
    return { ...this.state };
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const tokenResponse = await oauth.getAccessToken({
        scope,
        forceRefresh: false,
      });

      if (tokenResponse && tokenResponse.token) {
        this.setState({ accessToken: tokenResponse.token });
        return tokenResponse.token;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getCurrentUser(): UserProfile | null {
    return this.state.user;
  }
}

export default MicrosoftAuthService;
export type { UserProfile, MicrosoftAuthState };
