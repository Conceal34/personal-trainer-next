import { createClient } from '@/lib/supabase/server';
import { AdminChatInterface } from '@/src/app/components/admin/AdminChatInterface';

export default async function AdminChatPage() {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    const adminId = session?.user.id || '';

    // Find all unique client IDs the admin has chatted with
    const { data: messageUsers, error } = await supabase.rpc('get_chatted_user_ids');

    let clients: any[] = [];
    if (messageUsers) {
        const clientIds = messageUsers.map((u: any) => u.user_id);
        // Fetch profiles for those clients
        const { data: clientProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
        clients = clientProfiles || [];
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
