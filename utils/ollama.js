import ollama from 'ollama';

let modelLoaded = false;

export const loadModel = async () => {
  if (modelLoaded) {
    return { message: "Model is already loaded" };
  }
  await ollama.generate({
    model: 'phi3:mini',
    prompt: '',
    keep_alive: '10m'
  });
  modelLoaded = true;
  return { message: "Model loaded successfully" };
};

export const unloadModel = async () => {
  if (!modelLoaded) {
    return { message: "No model is currently loaded" };
  }
  await ollama.generate({
    model: 'phi3:mini',
    prompt: '',
    keep_alive: 0
  });
  modelLoaded = false;
  return { message: "Model unloaded successfully" };
};

export const promptLLM = async (prompt) => {
  if (!modelLoaded) {
    await ollama.generate({
      model: 'phi3:mini',
      prompt: '',
      keep_alive: '10m'
    });
    modelLoaded = true;
  }
  const response = await ollama.chat({
    model: 'phi3:mini',
    messages: [{ role: 'user', content: prompt }],
    keep_alive: '10m'
  });
  return response.message.content;
};