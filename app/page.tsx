import { redirect } from "next/navigation";
import { getActiveUserRecord } from "@/lib/session";

export default async function Home() {
  const user = await getActiveUserRecord();

  if (!user) {
    redirect("/login");
  }

  redirect(user.role === "MASTER" ? "/master" : "/dashboard");
}
