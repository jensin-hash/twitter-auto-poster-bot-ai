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
  maxOutputTokens: 120,
  temperature: 0.8,
  topP: 0.9,
  topK: 40,
  stopSequences: ["Option", "Options", "1)", "1.", "Tweet:", "Output:"],
};

const genAI = new GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

// ===== Cleaners =====
function hardClean(text) {
  let t = String(text);
  t = t.replace(/```[\s\S]*?```/g, "")
       .replace(/^["'`“”]+|["'`“”]+$/g, "")
       .replace(/^\s*(Option(s)?\s*\d*\s*[:\-)]\s*)/gi, "")
       .replace(/\bOption(s)?\b\s*\d*\s*[:\-)]?/gi, "")
       .replace(/^(Tweet|Output)\s*[:\-]\s*/gi, "");
  t = t.split(/\n|(?<=\!)\s|(?<=\?)\s|(?<=\.)\s/)[0];
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function sanitize(text) {
  return hardClean(text).replace(/\s*\n+\s*/g, " ").trim();
}

function ensureCompliance(text) {
  let t = sanitize(text);
  const required = ["@River4FUN", "#CryptoInnovation", "$RiverPts"];
  for (const token of required) {
    if (!t.includes(token)) {
      const room = 1 + token.length;
      if (t.length + room <= 280) t = `${t} ${token}`;
      else {
        t = t.slice(0, Math.max(0, 280 - room)).trimEnd();
        t = `${t} ${token}`;
      }
    }
  }
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
      "Write EXACTLY ONE tweet about the @River4FUN project. Hard requirements: include @River4FUN, $RiverPts, and #CryptoInnovation; max 280 chars. No headings, no lists, no 'Option', no colons after labels, no quotes, no code blocks. Start directly with the tweet text. Mix mass-market hype & tech-savvy (DeFi/DAO/utility). Avoid generic crypto clichés. Vary focus (community, utility, rewards, vision).";

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
