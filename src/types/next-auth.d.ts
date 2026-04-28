import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    track?: string;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      track?: string;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    track?: string;
    mustChangePassword: boolean;
  }
}
