// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// PATCH /api/tasks/:id — Update task (toggle complete, edit, v.v.)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Kiểm tra task thuộc về user này
  const existing = await db.task.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await db.task.update({
    where: { id: params.id },
    data: body,
  });

  try { await redis.del(`tasks:${session.user.id}`); } catch { }
  return NextResponse.json(task);
}

// DELETE /api/tasks/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.task.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.task.delete({ where: { id: params.id } });
  try { await redis.del(`tasks:${session.user.id}`); } catch { }
  return NextResponse.json({ success: true });
}
