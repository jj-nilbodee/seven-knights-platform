import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function upsertUser(data: {
  id: string;
  email: string;
  username: string;
}) {
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.id,
      set: { email: data.email, username: data.username },
    })
    .returning();
  return user;
}
