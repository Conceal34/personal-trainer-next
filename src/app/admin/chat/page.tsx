import { createClient } from "@/lib/supabase/server";
import { AdminChatInterface } from "@/app/components/admin/AdminChatInterface";
import { Database } from "@/types/database";

// Define a type for the RPC return based on your SQL function
interface ChattedUser {
  user_id: string;
}

// Extract the Profile type from your Database schema
type ClientProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name'>;

export default async function AdminChatPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  const adminId = session?.user.id || "";

  const { data: messageUsers } = await supabase.rpc(
    "get_chatted_user_ids"
  ) as { data: ChattedUser[] | null };

  let clients: ClientProfile[] = [];

  if (messageUsers && messageUsers.length > 0) {
    const clientIds = messageUsers.map((u) => u.user_id);
    
    const { data: clientProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", clientIds);
      
    if (clientProfiles) {
      clients = clientProfiles;
    }
  }

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