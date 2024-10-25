"use client";

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
    text: "Where do you lie on the following spectrum?",
    type: "scale",
    leftLabel: "Money",
    rightLabel: "Work/Life Balance",
  },
  {
    text: "Where do you lie on the following spectrum?",
    type: "scale",
    leftLabel: "Structure",
    rightLabel: "Autonomy",
  },
];

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Added state for submit button loading
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
    else {
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
    setIsSubmitting(true); // Set loading state
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
    } catch (error) {
      console.error('Error fetching follow-up question:', error);
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-100">
      <main className="flex flex-col gap-8 w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="text-2xl font-bold text-gray-800">{currentQuestion.text}</div>
          {currentQuestion.type === "open" ? (
            <textarea
              name={`question-${currentQuestionIndex}`}
              value={responses[`question-${currentQuestionIndex}`] || ""}
              onChange={handleResponseChange}
              className="border border-gray-300 p-3 w-full text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
            />
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full mb-4">
                <span className="mr-4 w-32 text-right text-gray-600">
                  {currentQuestion.leftLabel}
                </span>
                <div className="flex justify-between w-full px-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value={value}
                        checked={
                          (responses[`question-${currentQuestionIndex}`] || "3") ===
                          value.toString()
                        }
                        onChange={handleResponseChange}
                        className="form-radio text-blue-500 mb-1"
                      />
                      <span className="text-gray-700">{value}</span>
                    </label>
                  ))}
                </div>
                <span className="ml-4 w-32 text-left text-gray-600">
                  {currentQuestion.rightLabel}
                </span>
              </div>
              <textarea
                name={`explanation-${currentQuestionIndex}`}
                value={responses[`explanation-${currentQuestionIndex}`] || ""}
                onChange={handleResponseChange}
                placeholder="Explain your answer"
                className="border border-gray-300 p-3 w-full text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${
              isSubmitting ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-700"
            } text-white font-bold py-2 px-4 rounded`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          {followUpQuestion && (
            <div className="flex flex-col items-center mt-4">
              <div className="text-center font-semibold mb-2 text-gray-800">
                {followUpQuestion}
              </div>
              <textarea
                name={`followup-${currentQuestionIndex}`}
                value={responses[`followup-${currentQuestionIndex}`] || ""}
                onChange={handleResponseChange}
                placeholder="Your answer"
                className="border border-gray-300 p-3 w-full text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`${
                currentQuestionIndex === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded`}
            >
              Previous
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => alert("All questions completed!")}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Finish
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
