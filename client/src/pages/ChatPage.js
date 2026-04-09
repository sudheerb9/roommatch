import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const inputClass =
  'w-[120px] rounded-xl border border-[#881c1c]/20 bg-white px-2.5 py-2 text-sm text-[#100e06] outline-none focus:border-[#881c1c]/50 focus:ring-2 focus:ring-[#881c1c]/15';

const btnPrimaryClass =
  'rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60';

export default function ChatPage() {
  const [uiState, setUiState] = useState('loading');
  const [currentUserId, setCurrentUserId] = useState(1);
  const [targetUserId, setTargetUserId] = useState(2);
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const visibleMessages = useMemo(() => messages, [messages]);
  const isInputDisabled =
    uiState === 'loading' || uiState === 'error' || !chatId;

  async function bootstrapChat() {
    setUiState('loading');
    setErrorMessage('');

    try {
      const chatResponse = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator_user_id: currentUserId,
          recipient_user_id: targetUserId,
        }),
      });
      const chatPayload = await chatResponse.json();
      if (!chatResponse.ok) {
        throw new Error(chatPayload.error || 'Failed to initialize chat');
      }

      const activeChatId = chatPayload.chat.id;
      setChatId(activeChatId);

      const messagesResponse = await fetch(
        `${API_BASE_URL}/chats/${activeChatId}/messages?user_id=${currentUserId}`,
      );
      const messagesPayload = await messagesResponse.json();
      if (!messagesResponse.ok) {
        throw new Error(messagesPayload.error || 'Failed to load messages');
      }

      const loadedMessages = (messagesPayload.messages || []).map(
        (message) => ({
          id: message.id,
          sender: message.sender_user_id === currentUserId ? 'me' : 'other',
          text: message.body,
          timestamp: message.created_at,
        }),
      );

      setMessages(loadedMessages);
      setUiState(loadedMessages.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      setUiState('error');
      setErrorMessage(error.message || 'Unexpected error');
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
      const response = await fetch(
        `${API_BASE_URL}/chats/${chatId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_user_id: currentUserId,
            body: cleaned,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send message');
      }

      const nextMessage = {
        id: payload.message.id,
        sender: 'me',
        text: payload.message.body,
        timestamp: payload.message.created_at,
      };

      setMessages((currentMessages) => [...currentMessages, nextMessage]);
      setUiState('ready');
      setDraft('');
    } catch (error) {
      setUiState('error');
      setErrorMessage(error.message || 'Unexpected error');
    }
  }

  function renderConversationState() {
    if (uiState === 'loading') {
      return (
        <div
          className="grid min-h-[220px] flex-1 place-content-center justify-items-center gap-3 py-8 text-center text-[#100e06]/70"
          role="status"
          aria-live="polite"
        >
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
          <p className="text-sm font-medium">Loading conversation…</p>
        </div>
      );
    }

    if (uiState === 'error') {
      return (
        <div
          className="grid min-h-[220px] flex-1 place-content-center justify-items-center gap-4 px-4 py-8 text-center"
          role="alert"
        >
          <p className="max-w-md text-sm text-[#7a0019]">{errorMessage}</p>
          <button
            type="button"
            className={btnPrimaryClass}
            onClick={bootstrapChat}
          >
            Try again
          </button>
        </div>
      );
    }

    if (visibleMessages.length === 0) {
      return (
        <div className="grid min-h-[220px] flex-1 place-content-center justify-items-center gap-2 py-8 text-center text-[#100e06]/70">
          <p className="font-medium text-[#100e06]">No messages yet.</p>
          <span className="text-sm">Say hello to start the conversation.</span>
        </div>
      );
    }

    return (
      <ul className="grid list-none gap-2.5 p-4">
        {visibleMessages.map((message) => {
          const isMe = message.sender === 'me';

          return (
            <li
              key={message.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <article
                className={`grid max-w-[min(74%,520px)] gap-1.5 rounded-2xl px-3 py-2.5 ${
                  isMe
                    ? 'rounded-br-md bg-gradient-to-br from-[#7a0019] to-[#881c1c] text-white'
                    : 'rounded-bl-md border border-[#881c1c]/10 bg-white/70 text-[#100e06] backdrop-blur-sm'
                }`}
              >
                <p className="m-0 text-[0.94rem] leading-snug">{message.text}</p>
                <time
                  className={`justify-self-end text-[0.72rem] opacity-75 ${
                    isMe ? 'text-white/90' : 'text-[#100e06]/60'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </time>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl justify-center py-2">
      <section
        className="flex h-[min(760px,calc(100vh-8rem))] w-full flex-col overflow-hidden rounded-3xl border border-[#881c1c]/12 bg-white/60 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl"
        aria-label="Chat interaction panel"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#881c1c]/10 px-5 py-4">
          <div>
            <h1 className="m-0 text-lg font-bold text-[#100e06]">
              RoomMatch Chat
            </h1>
            <p className="mt-1 text-sm text-[#100e06]/60">
              {chatId ? `Connected to chat #${chatId}` : 'Connecting…'}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <label
              htmlFor="current-user-id"
              className="grid gap-1.5 text-[0.75rem] font-medium text-[#100e06]/70"
            >
              My user ID
              <input
                id="current-user-id"
                type="number"
                min="1"
                className={inputClass}
                value={currentUserId}
                onChange={(event) =>
                  setCurrentUserId(Number(event.target.value) || 1)
                }
              />
            </label>
            <label
              htmlFor="target-user-id"
              className="grid gap-1.5 text-[0.75rem] font-medium text-[#100e06]/70"
            >
              Peer user ID
              <input
                id="target-user-id"
                type="number"
                min="1"
                className={inputClass}
                value={targetUserId}
                onChange={(event) =>
                  setTargetUserId(Number(event.target.value) || 1)
                }
              />
            </label>
            <button
              type="button"
              className={`${btnPrimaryClass} self-end`}
              onClick={bootstrapChat}
            >
              Connect
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto">
          {renderConversationState()}
        </section>

        <form
          className="grid grid-cols-[1fr_auto] gap-2.5 border-t border-[#881c1c]/10 bg-white/50 px-3.5 py-3 backdrop-blur-sm"
          onSubmit={handleSend}
        >
          <input
            type="text"
            value={draft}
            placeholder="Type a message…"
            className="rounded-xl border border-[#881c1c]/15 bg-white/90 px-3 py-2.5 text-[0.94rem] text-[#100e06] outline-none focus:border-[#881c1c]/40 focus:ring-2 focus:ring-[#881c1c]/10"
            onChange={(event) => setDraft(event.target.value)}
            disabled={isInputDisabled}
            aria-label="Message input"
          />
          <button
            type="submit"
            className={btnPrimaryClass}
            disabled={isInputDisabled || draft.trim() === ''}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
