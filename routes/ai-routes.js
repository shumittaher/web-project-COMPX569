const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const articlesDao = require("../modules/articles-dao");

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function getOpenAIClient() {
  // OpenAI SDK is ESM-first, this works in CommonJS projects
  const OpenAI = (await import("openai")).default;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// GET /api/aiSummary/:articleId
router.get("/aiSummary/:articleId", middleware.verifyAuthenticated, async (req, res) => {
  const articleId = Number(req.params.articleId);
  const userId = req.session?.user?.id; 

  if (!Number.isFinite(articleId)) {
    return res.status(400).json({ error: "Invalid article id" });
  }

  try {
    // Load article (+ existing summary)
    const article = await articlesDao.getArticleById(articleId);
    
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Check permissions (only author can generate summary)
    if (article.userid !== userId) {
      return res.status(403).json({ error: "Only the author can generate the AI summary." });
    }

    //existing summary
    if (article.ai_summary && article.ai_summary.trim().length > 0) {
      return res.json({ summary: article.ai_summary, cached: true });
    }

    // 3) Generate summary via OpenAI
    const cleanText = stripHtml(article.content);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageAbsUrl = article.image_id ? `${baseUrl}/api/images/${article.image_id}` : null;
    const imageDataUrl = imageAbsUrl ? await toDataUrl(imageAbsUrl) : null;
    
    const client = await getOpenAIClient();
    
    const input = [{
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
          Summarize this forum article in 1 paragraph.
          Be concise, factual. If there is an image and it adds important context (diagram, screenshot, text), incorporate it.
          If the image seems decorative/irrelevant, ignore it.

          Title: ${article.title}

          Article:
          ${cleanText}`.trim()
        },
        ...(imageDataUrl ? [{ type: "input_image", image_url: imageDataUrl }] : [])
      ]
    }];

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: input,
    });

    const summary = (response.output_text || "").trim();

    if (!summary) {
      return res.status(500).json({ error: "AI returned an empty summary" });
    }

    // 4) Save summary
    const saveSuccess = await articlesDao.addAIDataToArticle(articleId, summary);
    if (!saveSuccess) {
      console.warn("Failed to save AI summary for article", articleId);
    }

    // 5) Return it
    res.json({ summary, cached: false });
  } catch (err) {
    console.error("aiSummary error:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

async function toDataUrl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Could not fetch image for summarization");
  const buf = Buffer.from(await r.arrayBuffer());
  const contentType = r.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

module.exports = router;
