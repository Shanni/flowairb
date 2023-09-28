import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

interface IParams {
  reservationId?: string;
}

// export async function PUT(
//   _: Request,
//   { params }: { params: IParams }
// ) {
//   const currentUser = await getCurrentUser();

//   if (!currentUser) {
//     return NextResponse.error();
//   }

//   const { reservationId } = params;

//   if (!reservationId || typeof reservationId !== "string") {
//     throw new Error("Invalid ID");
//   }

//   const reservation = await prisma.reservation.updateMany({
//     where: {
//       id: reservationId,
//       OR: [{ userId: currentUser.id }, { listing: { userId: currentUser.id } }],
//     },
//     data: {
//       status: "cancelled",
//     },
//   });

//   return NextResponse.json(reservation);
// }

export async function DELETE(_: Request, { params }: { params: IParams }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const { reservationId } = params;

  if (!reservationId || typeof reservationId !== "string") {
    throw new Error("Invalid ID");
  }

  const reservation = await prisma.reservation.deleteMany({
    where: {
      id: reservationId,
      OR: [{ userId: currentUser.id }, { listing: { userId: currentUser.id } }],
    },
  });

  return NextResponse.json(reservation);
}
