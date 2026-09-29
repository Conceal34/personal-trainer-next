import { createClient } from "@/lib/supabase/server";
import { AdminChatInterface } from "@/app/components/admin/AdminChatInterface";
import { Database } from "@/types/database";

// Extract the Profile type from your Database schema
type ClientProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

export default async function AdminChatPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const adminId = session?.user.id || "";

  const { data: clientProfiles, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "CLIENT");
  const clients: ClientProfile[] = clientProfiles || [];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        Client Chat
      </h1>
      <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
        RESPOND TO CLIENT MESSAGES
      </p>
      <AdminChatInterface clients={clients} adminId={adminId} />
    </div>
  );
}
