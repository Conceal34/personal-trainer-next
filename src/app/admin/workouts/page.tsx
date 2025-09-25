import { createClient } from '@/lib/supabase/server';
import { WorkoutPlanForm } from '@/src/app/components/admin/WorkoutPlanForm';

export type Client = { id: string; full_name: string | null; };

export default async function AdminWorkoutPage({
    searchParams
}: {
    searchParams: Promise<{ clientId?: string }>
}) {
    const supabase = await createClient();
    const { data: clients, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'CLIENT')
        .order('full_name', { ascending: true });

    if (error) {
        console.error('Error fetching clients:', error);
        return <p className="text-white p-8">Error loading clients. Please try again later.</p>;
    }

    const resolvedSearchParams = await searchParams;
    const preselectedClientId = resolvedSearchParams.clientId;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Create Workout Plan
            </h1>
            <p className="text-amber-400 text-sm uppercase font-semibold mb-8">
                ASSIGN A NEW REGIMEN
            </p>

            {/* Pass the pre-selected ID to the form */}
            <WorkoutPlanForm
                clients={clients || []}
                preselectedClientId={preselectedClientId}
            />
        </div>
    );
}