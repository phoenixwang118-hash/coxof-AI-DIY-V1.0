import { requireChatGPTUser } from "@/app/chatgpt-auth";
import AdminConsole from "./AdminConsole";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  return <AdminConsole user={{ name: user.displayName, email: user.email }} />;
}
