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
  const [followUpAnswered, setFollowUpAnswered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const loadModel = async () => {
      try {
        const response = await fetch("/api/loadModel", {
          method: "POST",
        });
        const data = await response.json();
        console.log(data.message);
        setModelLoaded(true);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };

    loadModel();
  }, []);

  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponses((prevResponses) => ({
      ...prevResponses,
      [name]: value,
    }));
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

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setResponses((prevResponses) => ({
      ...prevResponses,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentQuestion = questions[currentQuestionIndex];
    let userResponse = responses[`question-${currentQuestionIndex}`];

    // For scale questions, set default value to '3' if undefined
    if (currentQuestion.type === "scale") {
      if (userResponse === undefined) {
        userResponse = "3";
        setResponses((prevResponses) => ({
          ...prevResponses,
          [`question-${currentQuestionIndex}`]: "3",
        }));
      }
    }

    const explanation = responses[`explanation-${currentQuestionIndex}`];

    // Validation logic
    if (
      currentQuestion.type === "open" &&
      (!userResponse || userResponse.trim() === "")
    ) {
      alert("Please provide an answer before submitting.");
      return;
    } else if (
      currentQuestion.type === "scale" &&
      (!userResponse || userResponse.trim() === "") &&
      (!explanation || explanation.trim() === "")
    ) {
      alert("Please provide an answer before submitting.");
      return;
    }

    // Prepare the prompt for the LLM
    const prompt = `Ask the user a follow-up question based on their response to the previous question:\nQuestion: ${currentQuestion.text}\nResponse: ${userResponse}`;

    try {
      const response = await fetch("/api/promptLLM", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setFollowUpQuestion(result.message);
      setFollowUpAnswered(false);
    } catch (error) {
      console.error("Error fetching follow-up question:", error);
    }
  };

  const handleFollowUpSubmit = () => {
    const followUpResponse = responses[`followup-${currentQuestionIndex}`];

    if (!followUpResponse || followUpResponse.trim() === "") {
      alert("Please answer the follow-up question before proceeding.");
      return;
    }

    setFollowUpAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFollowUpQuestion("");
      setFollowUpAnswered(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setFollowUpQuestion("");
      setFollowUpAnswered(false);
    }
  };

  if (!modelLoaded) {
    return <div>Loading model...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen p-8 pb-20 flex items-center justify-center font-sans">
      <main className="w-full max-w-2xl">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="text-xl font-semibold">{currentQuestion.text}</div>

          {currentQuestion.type === "open" ? (
            <textarea
              name={`question-${currentQuestionIndex}`}
              value={responses[`question-${currentQuestionIndex}`] || ""}
              onChange={handleResponseChange}
              className="border p-2 w-full text-black rounded-md"
              rows={5}
              disabled={followUpQuestion && !followUpAnswered}
            />
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full mb-4">
                <span className="mr-4 w-32 text-right">
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
                        disabled={followUpQuestion && !followUpAnswered}
                        className="form-radio text-blue-500 mb-1"
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
                <span className="ml-4 w-32">
                  {currentQuestion.rightLabel}
                </span>
              </div>
              <textarea
                name={`explanation-${currentQuestionIndex}`}
                value={responses[`explanation-${currentQuestionIndex}`] || ""}
                onChange={handleResponseChange}
                placeholder="Explain your answer"
                className="border p-2 w-full text-black rounded-md"
                rows={4}
                disabled={followUpQuestion && !followUpAnswered}
              />
            </div>
          )}

          {!followUpQuestion && (
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Submit
            </button>
          )}

          {followUpQuestion && !followUpAnswered && (
            <div className="flex flex-col items-center mt-4">
              <div className="text-center font-semibold mb-2">
                {followUpQuestion}
              </div>
              <textarea
                name={`followup-${currentQuestionIndex}`}
                value={responses[`followup-${currentQuestionIndex}`] || ""}
                onChange={handleResponseChange}
                placeholder="Your answer"
                className="border p-2 w-full text-black rounded-md"
                rows={4}
              />
              <button
                type="button"
                onClick={handleFollowUpSubmit}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
              >
                Submit Follow-Up
              </button>
            </div>
          )}

          {(followUpQuestion === "" || followUpAnswered) && (
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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
          )}
        </form>
      </main>
    </div>
  );
}
