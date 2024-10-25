import { loadModel } from '../../utils/ollama';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await loadModel();
      res.status(200).json({ message: result });
    } catch (err) {
      console.error("Error prompting the model:", err);
      res.status(500).json({ error: "Failed to prompt the model" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}