import { getServerSession } from "next-auth/next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/libs/prismadb";

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentUser() {
  try {
    const session = await getSession();

    if (!session?.user?.email && !session?.user?.walletAddress) {
      return null;
    }
    let currentUser: any;
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: {
          email: session.user.email as string,
        },
      });
    } else {
      const wallet = await prisma.wallet.findUnique({
        where: {
          web3address: session.user.walletAddress as string,
        },
      });

      if (!wallet) {
        return null;
      }

      currentUser = await prisma.user.findUnique({
        where: {
          id: wallet.userId,
        },
      });
    }

    if (!currentUser) {
      return null;
    }

    return {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
      emailVerified: currentUser.emailVerified?.toISOString() || null,
    };
  } catch (error: any) {
    return null;
  }
}
