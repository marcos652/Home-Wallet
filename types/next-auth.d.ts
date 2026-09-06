declare module "next-auth" {
  interface User {
    role: "MASTER" | "USER";
    status: "ACTIVE" | "INACTIVE";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "MASTER" | "USER";
      status: "ACTIVE" | "INACTIVE";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "MASTER" | "USER";
    status: "ACTIVE" | "INACTIVE";
  }
}

export {};
