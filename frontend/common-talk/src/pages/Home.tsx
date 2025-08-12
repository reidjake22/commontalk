import { useState, useEffect } from 'react';
import { FeaturedTopics } from "../components/FeaturedTopics";
import { FeaturedDebates } from "../components/FeaturedDebates";
import { FeaturedPeople } from "../components/FeaturedPeople";

export default function Home() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/featured/topics');
        console.log(response);
        const data = await response.json();
        
        if (data.success) {
          setTopics(data.data);
        } else {
          console.error('API error:', data.error);
          setTopics([]);
        }
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Static data for other components
  const debates = [
    { id: 147, title: "Should the UK Rejoin the EU Single Market?", summary: "Heated parliamentary discussion..." },
    // ... rest of static debates
  ];

  const people = [
    { id: 47, name: "Rt Hon Jeremy Hunt", role: "Chancellor", avatar: "" },
    // ... rest of static people
  ];

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="text-center">Loading trending topics...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-12">
      <section>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold font-serif tracking-tight">Trending</h1>
          <p className="text-sm text-gray-600">Live snapshot of what's hot right now</p>
        </div>
        
        <div className="mt-6">
          <FeaturedTopics topics={topics} />
        </div>

        <div className="mt-6">
          <FeaturedDebates debates={debates} big={false} />
        </div>

        <div className="mt-6">
          <FeaturedPeople members={people} big={false} />
        </div>
      </section>
    </main>
  );
}
