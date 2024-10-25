"use client"

import { useState, useEffect } from "react";
import { useRouter } from 'next/router';


const questions = [
  {
    text: "What are your top 5 strengths, whether academic or interpersonal? Describe why those are your strengths.",
    type: "open",
  },
  {
    text: "What activities and pursuits genuinely excite and motivate you? Why?",
    type: "open",
  },
  {
    text: "Where do you lie on the following spectrum: Money = 1 , Work/Life Balance = 5. Why?",
    type: "scale",
  },
  {
    text: "Where do you lie on the following spectrum: Structure = 1 , Autonomy = 5. Why?",
    type: "scale",
  },
];

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const router = useRouter();


  useEffect(() => {
    const loadModel = async () => {
      try {
        const response = await fetch('/api/loadModel', {
          method: 'POST',
        });
        const data = await response.json();
        console.log(data.message);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };
  
    loadModel();
  }, []);

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFollowUpQuestion("");
    }
    else{
      console.log("Assessment completed");
      const prompt = `Based on the user's responses to the following questions, suggest some suitable careers:\n${Object.keys(responses).map(key => `Question: ${questions[parseInt(key.split('-')[1])].text}\nResponse: ${responses[key]}`).join('\n')}`;

      try {
        const response = await fetch('/api/promptLLM', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Suggested careers:", result.message);
        router.push({
          pathname: '/suggestedJobs', // Page to display the suggested jobs
          query: { careers: result.message }, // Pass careers as query params
        });
      } catch (error) {
        console.error('Error fetching career suggestions:', error);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setFollowUpQuestion("");
    }
  };

  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponses({
      ...responses,
      [name]: value,
    });
    console.log("handleResponseChange", responses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentQuestion = questions[currentQuestionIndex].text;
    const userResponse = responses[`question-${currentQuestionIndex}`];
    const prompt = `Ask the user a follow-up question based on their response to the previous question:\nQuestion: ${currentQuestion}\nResponse: ${userResponse}`;
  
    try {
      const response = await fetch('/api/promptLLM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt, // Include the prompt with the question and response
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      setFollowUpQuestion(result.message);
      // console.log(result.message);
    } catch (error) {
      console.error('Error fetching follow-up question:', error);
    }
    // console.log("handleSubmit", responses);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>
          <form className="flex flex-col gap-4 items-center">
            <div>{questions[currentQuestionIndex].text}</div>
            {questions[currentQuestionIndex].type === "open" ? (
              <textarea
                name={`question-${currentQuestionIndex}`}
                value={responses[`question-${currentQuestionIndex}`] || ""}
                onChange={handleResponseChange}
                className="border p-2 w-full text-black"
              />
            ) : (
              <div className="flex flex-col items-center">
                <input
                  type="range"
                  name={`question-${currentQuestionIndex}`}
                  min="1"
                  max="5"
                  value={responses[`question-${currentQuestionIndex}`] || "3"}
                  onChange={handleResponseChange}
                  className="w-full"
                />
                <textarea
                  name={`explanation-${currentQuestionIndex}`}
                  value={responses[`explanation-${currentQuestionIndex}`] || ""}
                  onChange={handleResponseChange}
                  placeholder="Explain your answer"
                  className="border p-2 w-full mt-2 text-black"
                />
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2"
            > 
              Submit 
            </button>
            {followUpQuestion && <div className="text-center">{followUpQuestion}</div>}
            {followUpQuestion && <textarea
              placeholder="Explain your answer"
              className="border p-2 w-full mt-2 text-black"
            />}
            <div>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                // disabled={currentQuestionIndex === questions.length - 1}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}