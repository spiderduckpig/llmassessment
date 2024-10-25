import { unloadModel } from '../../utils/ollama';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await unloadModel();
      res.status(200).json(result);
    } catch (err) {
      console.error("Error unloading model:", err);
      res.status(500).json({ error: "Failed to unload the model" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}