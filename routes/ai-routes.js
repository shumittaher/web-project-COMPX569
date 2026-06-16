const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const articlesDao = require("../modules/articles-dao");

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getAnthropicClient() {
  const Anthropic = require("@anthropic-ai/sdk");
  return new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
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

    // Return cached summary if it exists
    if (article.ai_summary && article.ai_summary.trim().length > 0) {
      return res.json({ summary: article.ai_summary, cached: true });
    }

    // Generate summary via Claude
    const cleanText = stripHtml(article.content);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageAbsUrl = article.image_id ? `${baseUrl}/api/images/${article.image_id}` : null;
    const imageData = imageAbsUrl ? await fetchImageData(imageAbsUrl) : null;

    const client = getAnthropicClient();

    const messages = [{
      role: "user",
      content: [
        {
          type: "text",
          text: `
          Summarize this forum article in 1 paragraph.
          Be concise, factual. If there is an image and it adds important context (diagram, screenshot, text), incorporate it.
          If the image seems decorative/irrelevant, ignore it.

          Title: ${article.title}

          Article:
          ${cleanText}`.trim()
        },
        ...(imageData ? [{
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.base64
          }
        }] : [])
      ]
    }];

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      messages
    });

    const firstBlock = response.content.find(b => b.type === "text");
    const summary = (firstBlock?.text || "").trim();

    if (!summary) {
      return res.status(500).json({ error: "AI returned an empty summary" });
    }

    // Save summary
    const saveSuccess = await articlesDao.addAIDataToArticle(articleId, summary);
    if (!saveSuccess) {
      console.warn("Failed to save AI summary for article", articleId);
    }

    res.json({ summary, cached: false });
  } catch (err) {
    console.error("aiSummary error:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

async function fetchImageData(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Could not fetch image for summarization");
  const buf = Buffer.from(await r.arrayBuffer());
  const mediaType = r.headers.get("content-type") || "image/jpeg";
  return { base64: buf.toString("base64"), mediaType };
}

module.exports = router;
