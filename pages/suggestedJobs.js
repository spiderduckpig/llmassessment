import { useRouter } from 'next/router';

export default function suggestedJobs() {
  const router = useRouter();
  const { careers } = router.query;

//   const parsedCareers = careers ? JSON.parse(careers) : [];

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Suggested Careers</h1>
        <ul>
          {/* {careers && careers.split(',').map((career, index) => (
            <li key={index} className="mt-2 text-xl">
            {career.trim()}
            </li>
          ))} */}
          {careers && careers}
        </ul>
    </div>
  );
}
