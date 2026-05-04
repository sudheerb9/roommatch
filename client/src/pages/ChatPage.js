import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const btnPrimaryClass =
  'rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [uiState, setUiState] = useState('loading');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [matchOptions, setMatchOptions] = useState([]);
  const [targetUserId, setTargetUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const visibleMessages = useMemo(() => messages, [messages]);
  const isInputDisabled =
    uiState === 'loading' || uiState === 'error' || !chatId || !targetUserId;

  async function loadMessages(activeChatId, activeCurrentUserId) {
    const messagesPayload = await apiFetch(
      `/chats/${activeChatId}/messages?user_id=${activeCurrentUserId}`,
    );
    return (messagesPayload.messages || []).map((message) => ({
      id: message.id,
      sender: message.sender_user_id === activeCurrentUserId ? 'me' : 'other',
      text: message.body,
      timestamp: message.created_at,
    }));
  }

  async function bootstrapChat(activeCurrentUserId, activeTargetUserId) {
    if (!activeCurrentUserId || !activeTargetUserId) return;
    setUiState('loading');
    setErrorMessage('');

    try {
      const chatPayload = await apiFetch('/chats', {
        method: 'POST',
        body: {
          initiator_user_id: activeCurrentUserId,
          recipient_user_id: activeTargetUserId,
        },
      });
      const activeChatId = chatPayload.chat.id;
      setChatId(activeChatId);

      const loadedMessages = await loadMessages(activeChatId, activeCurrentUserId);

      setMessages(loadedMessages);
      setUiState(loadedMessages.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      setUiState('error');
      setErrorMessage(error.message || 'Unexpected error');
    }
  }

  useEffect(() => {
    let cancelled = false;
    const recipientFromQuery = Number(searchParams.get('recipient'));
    const hasValidRecipient =
      Number.isInteger(recipientFromQuery) && recipientFromQuery > 0;
    async function loadIdentityAndMatches() {
      setLoadingMatches(true);
      try {
        const profilePayload = await apiFetch('/profile/me');
        const meId = profilePayload?.user?.id;
        if (!Number.isInteger(meId) || meId <= 0) {
          throw new Error('Unable to resolve your account for chat.');
        }

        const matchesPayload = await apiFetch('/matches?page=1&limit=50');
        const options = Array.isArray(matchesPayload?.items)
          ? matchesPayload.items.map((item) => ({
              userId: item.user_id,
              displayName: item.display_name || item.email || `User ${item.user_id}`,
              email: item.email || '',
            }))
          : [];

        if (cancelled) return;

        setCurrentUserId(meId);
        setMatchOptions(options);

        const defaultTarget =
          hasValidRecipient &&
          options.some((option) => option.userId === recipientFromQuery)
            ? recipientFromQuery
            : options[0]?.userId ?? null;

        setTargetUserId(defaultTarget);
        if (!defaultTarget) {
          setChatId(null);
          setMessages([]);
          setUiState('empty');
        }
      } catch (error) {
        if (cancelled) return;
        setUiState('error');
        setErrorMessage(error.message || 'Failed to load chat users.');
      } finally {
        if (!cancelled) {
          setLoadingMatches(false);
        }
      }
    }

    loadIdentityAndMatches();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!currentUserId || !targetUserId || loadingMatches) return;
    bootstrapChat(currentUserId, targetUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId, loadingMatches]);

  useEffect(() => {
    if (!chatId || !currentUserId || uiState === 'error') {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const latestMessages = await loadMessages(chatId, currentUserId);
        setMessages((existing) => {
          if (
            existing.length === latestMessages.length &&
            existing[existing.length - 1]?.id === latestMessages[latestMessages.length - 1]?.id
          ) {
            return existing;
          }
          return latestMessages;
        });
        if (latestMessages.length > 0) {
          setUiState('ready');
        }
      } catch {
        // Ignore transient polling errors and keep current chat state.
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [chatId, currentUserId, uiState]);

  async function handleSend(event) {
    event.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isInputDisabled || !chatId) {
      return;
    }

    try {
      const payload = await apiFetch(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: {
          sender_user_id: currentUserId,
          body: cleaned,
        },
      });

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

  const activeTarget = useMemo(
    () => matchOptions.find((option) => option.userId === targetUserId),
    [matchOptions, targetUserId],
  );

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
            onClick={() => {
              if (currentUserId && targetUserId) {
                bootstrapChat(currentUserId, targetUserId);
              }
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    if (visibleMessages.length === 0) {
      return (
        <div className="grid min-h-[220px] flex-1 place-content-center justify-items-center gap-2 py-8 text-center text-[#100e06]/70">
          <p className="font-medium text-[#100e06]">
            {targetUserId ? 'No messages yet.' : 'No conversation available yet.'}
          </p>
          <span className="text-sm">
            {targetUserId
              ? 'Say hello to start the conversation.'
              : 'Get matched with another user to start chatting.'}
          </span>
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
              {chatId
                ? activeTarget
                  ? `Chatting with ${activeTarget.displayName}`
                  : `Connected to chat #${chatId}`
                : 'Connecting…'}
            </p>
          </div>
          <label
            htmlFor="chat-recipient"
            className="grid min-w-[230px] gap-1.5 text-[0.75rem] font-medium text-[#100e06]/70"
          >
            Conversation
            <select
              id="chat-recipient"
              className="h-10 rounded-xl border border-[#881c1c]/20 bg-white px-3 text-sm text-[#100e06] outline-none focus:border-[#881c1c]/45 focus:ring-2 focus:ring-[#881c1c]/10"
              value={targetUserId ?? ''}
              disabled={loadingMatches || matchOptions.length === 0}
              onChange={(event) => setTargetUserId(Number(event.target.value))}
            >
              {matchOptions.length === 0 ? (
                <option value="">
                  {loadingMatches ? 'Loading matches...' : 'No chat options'}
                </option>
              ) : null}
              {matchOptions.map((option) => (
                <option key={option.userId} value={option.userId}>
                  {option.displayName}
                  {option.email ? ` (${option.email})` : ''}
                </option>
              ))}
            </select>
          </label>
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
