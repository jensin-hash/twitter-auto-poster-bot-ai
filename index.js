// By VishwaGauravIn (https://itsvg.in)

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 200, // 400 boleh, tapi 200 cukup untuk tweet
};

const genAI = new GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

// ===== Utils =====
function sanitize(text) {
  // rapikan output: hilangkan backticks/quote dan baris ganda
  return String(text)
    .replace(/^[`'"“”]+|[`'"“”]+$/g, "")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

function ensureCompliance(text) {
  // pastikan wajib ada @River4FUN, #CryptoInnovation, $RiverPts
  let t = sanitize(text);

  const required = ["@River4FUN", "#CryptoInnovation", "$RiverPts"];
  for (const token of required) {
    if (!t.includes(token)) {
      // jika muat, tambahkan di akhir; kalau nggak, sisipkan/replace terakhir
      if (t.length + 1 + token.length <= 280) {
        t = `${t} ${token}`;
      } else {
        // potong sedikit agar muat token
        const spaceForToken = 1 + token.length;
        t = t.slice(0, Math.max(0, 280 - spaceForToken)).trimEnd();
        t = `${t} ${token}`;
      }
    }
  }

  // jaga-jaga: pastikan maksimum 280
  if (t.length > 280) t = t.slice(0, 280).trimEnd();
  return t;
}

// ===== Main =====
async function run() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
    });

    const prompt =
      "Generate a short, original, and hype tweet (max 280 chars) about the @River4FUN project. Always include @River4FUN, $RiverPts, and #CryptoInnovation. Mix styles: (1) mass-market hype & community, (2) tech-savvy crypto (DeFi, DAO, utility). Vary focus, avoid generic crypto talk.";

    // ✅ Panggil model.generateContent untuk mendapat response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const text = ensureCompliance(rawText);
    console.log("Generated tweet:", text, `\n(${text.length} chars)`);

    await sendTweet(text);
  } catch (err) {
    console.error("Generation error:", err);
  }
}

run();

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}
