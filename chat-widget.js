// AI чат-консультант Eco Meister Haus.
// Работает через Cloudflare Worker (см. worker.js), который прячет API-ключ.
// ЗАМЕНИТЕ значение ниже на реальный URL вашего задеплоенного Worker.
const CHAT_WORKER_URL = "https://REPLACE-ME.workers.dev";

let chatHistory = [];
let chatOpened = false;

function t(key) {
  const lang = localStorage.getItem("lang") || "de";
  return (translations[lang] && translations[lang][key]) || "";
}

function toggleChat() {
  const win = document.getElementById("chatWindow");
  if (!win) return;
  const willOpen = win.classList.contains("hidden");
  win.classList.toggle("hidden");
  if (willOpen && !chatOpened) {
    chatOpened = true;
    renderChatUI();
    addBotMessage(t("chatGreeting"));
  }
}

function closeChat() {
  const win = document.getElementById("chatWindow");
  if (win) win.classList.add("hidden");
}

function renderChatUI() {
  const titleEl = document.getElementById("chatTitleText");
  const subEl = document.getElementById("chatSubtitleText");
  const placeholderEl = document.getElementById("chatInput");
  const disclaimerEl = document.getElementById("chatDisclaimerText");
  if (titleEl) titleEl.innerText = t("chatTitle");
  if (subEl) subEl.innerText = t("chatSubtitle");
  if (placeholderEl) placeholderEl.placeholder = t("chatPlaceholder");
  if (disclaimerEl) disclaimerEl.innerText = t("chatDisclaimer");
}

function addBotMessage(text) {
  chatHistory.push({ role: "assistant", content: text });
  appendMessageBubble(text, "bot");
}

function addUserMessage(text) {
  chatHistory.push({ role: "user", content: text });
  appendMessageBubble(text, "user");
}

function appendMessageBubble(text, who) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const bubble = document.createElement("div");
  bubble.className =
    who === "user"
      ? "self-end bg-[#3e2723] text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%] whitespace-pre-wrap"
      : "self-start bg-gray-100 text-[#3e2723] text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%] whitespace-pre-wrap";
  bubble.innerText = text;
  const wrap = document.createElement("div");
  wrap.className = "flex " + (who === "user" ? "justify-end" : "justify-start");
  wrap.appendChild(bubble);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const wrap = document.createElement("div");
  wrap.id = "chatTyping";
  wrap.className = "flex justify-start";
  wrap.innerHTML =
    '<div class="self-start bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">…</div>';
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
  const el = document.getElementById("chatTyping");
  if (el) el.remove();
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.disabled = true;

  addUserMessage(text);
  showTypingIndicator();

  try {
    const res = await fetch(CHAT_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });
    const data = await res.json();
    hideTypingIndicator();
    if (!res.ok || !data.reply) {
      addBotMessage(t("chatError"));
    } else {
      addBotMessage(data.reply);
    }
  } catch (err) {
    hideTypingIndicator();
    addBotMessage(t("chatError"));
  } finally {
    input.disabled = false;
    input.focus();
  }
}

function handleChatKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}
