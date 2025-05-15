// By VishwaGauravIn (https://itsvg.in)

const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 400,
};
const genAI = new GenAI.GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

async function run() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig,
  });

  // Write your prompt here
  const prompt =
    "Generate a short, original, and highly practical tip or trick (max 280 characters) about Web3 or crypto. The tip must be actionable, insightful, and immediately useful for beginners or intermediate users-strictly avoid generic, vague, or repetitive advice. Write in a friendly, encouraging, and conversational tone that feels personal and approachable. The tip should introduce a fresh perspective, smart shortcut, or little-known strategy that users can apply right away. Use at least one relevant emoji to boost clarity or emphasis, but keep the language simple, concise, and free of technical jargon. Always mention @GiveRep @KaitoAI in the tweet. Do not use hashtags, links, promotional phrases, or any form of self-promotion.";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  sendTweet(text);
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
