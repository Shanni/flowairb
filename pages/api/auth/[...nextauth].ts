import bcrypt from "bcrypt";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { User } from "@prisma/client";

import prisma from "@/app/libs/prismadb";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.hashedPassword) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
    CredentialsProvider({
      id: "web3wallet",
      name: "web3wallet",
      credentials: {
        walletAddress: { label: "walletAddress", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress) {
          throw new Error("Invalid credentials");
        }

        const wallet = await prisma.wallet.findUnique({
          where: {
            web3address: credentials.walletAddress,
          },
        });

        if (!wallet) {
          //create new user
          const newUser = await prisma.user.create({
            data: {
              name: "web3wallet",
              email: credentials.walletAddress,
            },
          });

          //create wallet
          const newWallet = await prisma.wallet.create({
            data: {
              web3address: credentials.walletAddress,
              userId: newUser.id,
            },
          });

          return newUser;
        } else {
          const user = await prisma.user.findUnique({
            where: {
              id: wallet.userId,
            },
          });

          return user;
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt(params) {
      //console.log("jwt:" + params);

      params.user && (params.token.user = params.user);

      return params.token;
    },
    async session(params) {
      //console.log("session:" + params);

      const user: User = params.token.user as User;

      user && (params.session.user = user);

      return params.session;
    },
  },
};

export default NextAuth(authOptions);
