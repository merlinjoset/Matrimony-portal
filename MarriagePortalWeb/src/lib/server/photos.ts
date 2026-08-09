import "server-only";
import { randomUUID } from "crypto";
import { sql } from "./db";

/** Store an image in the database (persists across deploys). Returns the photo id. */
export async function savePhoto(data: Buffer, contentType: string): Promise<string> {
  const id = randomUUID();
  await sql`
    INSERT INTO "TblPhotos" ("Id","ContentType","Data","Bytes","CreatedAt")
    VALUES (${id}, ${contentType}, ${data}, ${data.length}, now())`;
  return id;
}

export async function getPhoto(id: string): Promise<{ data: Buffer; contentType: string } | null> {
  const rows = await sql`SELECT "ContentType","Data" FROM "TblPhotos" WHERE "Id" = ${id} LIMIT 1`;
  const r = rows[0];
  if (!r) return null;
  return { data: Buffer.from(r.Data as Buffer), contentType: (r.ContentType as string) || "image/jpeg" };
}
