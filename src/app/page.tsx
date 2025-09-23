import Link from 'next/link';
import Image from 'next/image';
import { Button } from './components/button'; // Import our new Button
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { createClient } from '@/lib/supabase/server';
import SiteHeader from './components/SiteHeader'; // Using alias for components

// Define a TypeScript type for our plan data
type Plan = {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  features: string[];
};

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch plans data from the database
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    // You could return a message or a fallback UI here
  }

  return (
    <div className="bg-black text-white font-sans">
      <SiteHeader /> {/* Use the new client component for the header */}

      <main className="isolate">
        {/* Hero Section */}
        <div className="relative">
          {/* The Image Background */}
          <div className="absolute inset-0">
            <Image
              src="/1st_sect_img.jpg"
              alt="Gym background"
              fill
              className="object-cover"
              priority // Load this image first
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          </div>

          {/* Your Content (now relative to the parent div) */}
          <div className="relative isolate py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
              <p className="text-lg font-semibold leading-8 text-amber-400">EXPERIENCE THE GREAT GYM OF KHARAR</p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
                LIFT, <span className="text-amber-400">ASCEND</span>, DOMINATE
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Stop wishing, start doing. Your journey to greatness begins with a single step. Join us today.
              </p>
              <div className="mt-10">
                <Button href="/auth" size="lg">JOIN NOW!</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <section id="plans" className="w-full py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-lg font-semibold leading-8 text-amber-400">PLANS</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">EARLY BIRD OFFER!</h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Take advantage of the early bird offer and save up to 10% on your subscription. Limited to the first 100 sign-ups only!
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {plans?.map((plan: Plan) => (
                <div key={plan.id} className="flex flex-col p-8 bg-gray-900/50 rounded-2xl border-2 border-gray-700 hover:border-amber-400 transition-all">
                  <p className="mb-6 text-center text-xs font-medium bg-amber-50 text-black p-2 rounded-full w-fit mx-auto px-4">VALID FOR FIRST 100 SIGNUPS</p>
                  <div className="text-center">
                    {plan.original_price && (
                      <h3 className="line-through text-2xl text-gray-500">
                        ₹{plan.original_price / 100}
                      </h3>
                    )}
                    <h2 className="text-amber-300 text-5xl font-bold">
                      ₹{plan.price / 100}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">{plan.name}</p>
                  </div>
                  <hr className="w-full border-t-2 border-gray-700 my-6" />
                  <ul className="space-y-3 text-sm flex-grow">
                    {plan.features?.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-amber-300 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button href="/auth" className="w-full">JOIN NOW!</Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="flex flex-col lg:flex-row w-full items-center gap-12 px-6 lg:px-8 py-24 sm:py-32">
          <div className="w-full lg:w-1/2">
            <p className="text-lg font-semibold leading-8 text-amber-400 mb-2">ABOUT US</p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-8">ARE YOU READY TO TRAIN LIKE A PRO?</h2>
            <p className="text-lg text-gray-300 leading-8">
              At Ascend Fitness, every workout is a masterclass in performance. Whether you are sculpting a chiseled physique, amplifying your strength, or boosting your endurance, our pro-trainers will help you at every corner.
            </p>
            <Button href="/auth" variant="outline">LEARN MORE</Button>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <Image
              src="/2nd_img.jpg" // Assumes image is in the `public` folder
              alt="Athlete training at Ascend Fitness"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl object-cover"
            />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-700 pt-8">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-amber-300">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-amber-300">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-amber-300">Contact</Link>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Ascend Fitness. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}