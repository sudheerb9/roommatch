import { useEffect, useMemo, useState } from "react";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [uiState, setUiState] = useState("loading");
  const [currentUserId, setCurrentUserId] = useState(1);
  const [targetUserId, setTargetUserId] = useState(2);
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const visibleMessages = useMemo(() => messages, [messages]);
  const isInputDisabled = uiState === "loading" || uiState === "error" || !chatId;

  async function bootstrapChat() {
    setUiState("loading");
    setErrorMessage("");

    try {
      const chatResponse = await fetch(`${API_BASE_URL}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiator_user_id: currentUserId,
          recipient_user_id: targetUserId,
        }),
      });
      const chatPayload = await chatResponse.json();
      if (!chatResponse.ok) {
        throw new Error(chatPayload.error || "Failed to initialize chat");
      }

      const activeChatId = chatPayload.chat.id;
      setChatId(activeChatId);

      const messagesResponse = await fetch(
        `${API_BASE_URL}/chats/${activeChatId}/messages?user_id=${currentUserId}`,
      );
      const messagesPayload = await messagesResponse.json();
      if (!messagesResponse.ok) {
        throw new Error(messagesPayload.error || "Failed to load messages");
      }

      const loadedMessages = (messagesPayload.messages || []).map((message) => ({
        id: message.id,
        sender: message.sender_user_id === currentUserId ? "me" : "other",
        text: message.body,
        timestamp: message.created_at,
      }));

      setMessages(loadedMessages);
      setUiState(loadedMessages.length === 0 ? "empty" : "ready");
    } catch (error) {
      setUiState("error");
      setErrorMessage(error.message || "Unexpected error");
    }
  }

  useEffect(() => {
    bootstrapChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(event) {
    event.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isInputDisabled || !chatId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_user_id: currentUserId,
          body: cleaned,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send message");
      }

      const nextMessage = {
        id: payload.message.id,
        sender: "me",
        text: payload.message.body,
        timestamp: payload.message.created_at,
      };

      setMessages((currentMessages) => [...currentMessages, nextMessage]);
      setUiState("ready");
      setDraft("");
    } catch (error) {
      setUiState("error");
      setErrorMessage(error.message || "Unexpected error");
    }
  }

  function renderConversationState() {
    if (uiState === "loading") {
      return (
        <div className="state state-loading" role="status" aria-live="polite">
          <div className="spinner" />
          <p>Loading conversation...</p>
        </div>
      );
    }

    if (uiState === "error") {
      return (
        <div className="state state-error" role="alert">
          <p>{errorMessage || "We could not load this chat right now."}</p>
          <button className="retry-button" onClick={bootstrapChat} type="button">
            Try again
          </button>
        </div>
      );
    }

    if (visibleMessages.length === 0) {
      return (
        <div className="state state-empty">
          <p>No messages yet.</p>
          <span>Say hello to start the conversation.</span>
        </div>
      );
    }

    return (
      <ul className="messages-list">
        {visibleMessages.map((message) => {
          const isMe = message.sender === "me";

          return (
            <li
              key={message.id}
              className={`message-row ${isMe ? "message-row-me" : "message-row-other"}`}
            >
              <article className={`bubble ${isMe ? "bubble-me" : "bubble-other"}`}>
                <p className="message-text">{message.text}</p>
                <time className="message-time">{formatTime(message.timestamp)}</time>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <main className="chat-page">
      <section className="chat-shell" aria-label="Chat interaction panel">
        <header className="chat-header">
          <div>
            <h1>RoomMatch Chat</h1>
            <p>{chatId ? `Connected to chat #${chatId}` : "Connecting..."}</p>
          </div>
          <div className="chat-controls">
            <label htmlFor="current-user-id">
              My user ID
              <input
                id="current-user-id"
                type="number"
                min="1"
                value={currentUserId}
                onChange={(event) => setCurrentUserId(Number(event.target.value) || 1)}
              />
            </label>
            <label htmlFor="target-user-id">
              Peer user ID
              <input
                id="target-user-id"
                type="number"
                min="1"
                value={targetUserId}
                onChange={(event) => setTargetUserId(Number(event.target.value) || 1)}
              />
            </label>
            <button type="button" className="retry-button" onClick={bootstrapChat}>
              Connect
            </button>
          </div>
        </header>

        <section className="chat-body">{renderConversationState()}</section>

        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            type="text"
            value={draft}
            placeholder="Type a message..."
            onChange={(event) => setDraft(event.target.value)}
            disabled={isInputDisabled}
            aria-label="Message input"
          />
          <button type="submit" disabled={isInputDisabled || draft.trim() === ""}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
