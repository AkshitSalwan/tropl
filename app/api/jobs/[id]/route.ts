// ...existing code...
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const { jobCode, createdAt, updatedAt, ...allowedData } = data;

    const updatedJob = await prisma.job.update({
      where: { id },
      data: allowedData,
    });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
