// Page-level container for ChatPage view state and user interactions.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function formatTime(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatGroupStatus(status) {
  if (status === 'ready') return 'ready for allotment';
  return status;
}

const btnPrimaryClass =
  'rounded-xl bg-gradient-to-r from-[#7a0019] to-[#881c1c] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#7a0019]/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [uiState, setUiState] = useState('loading');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [directConversations, setDirectConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState('');
  const [groupMemberNames, setGroupMemberNames] = useState({});

  const preselectedRecipient = useMemo(() => {
    const raw = Number(searchParams.get('recipient'));
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const preselectedGroup = useMemo(() => {
    const raw = Number(searchParams.get('group'));
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);

  const visibleMessages = useMemo(() => messages, [messages]);
  const isInputDisabled =
    uiState === 'loading' || uiState === 'error' || !chatId || !selectedConversation;

  async function loadMessages(activeChatId, activeCurrentUserId) {
    const payload = await apiFetch(
      `/chats/${activeChatId}/messages?user_id=${activeCurrentUserId}`
    );
    return (payload.messages || []).map((message) => ({
      id: message.id,
      senderUserId: Number(message.sender_user_id),
      text: message.body,
      timestamp: message.created_at,
    }));
  }

  async function openConversation(activeUserId, conversation) {
    if (!activeUserId || !conversation) return;
    setUiState('loading');
    setErrorMessage('');
    setMessages([]);
    setChatId(null);

    try {
      let resolvedChatId = null;
      if (conversation.type === 'direct') {
        setGroupMemberNames({});
        // Direct chats are idempotently created/reused by this endpoint.
        const payload = await apiFetch('/chats', {
          method: 'POST',
          body: {
            initiator_user_id: activeUserId,
            recipient_user_id: conversation.id,
          },
        });
        resolvedChatId = payload?.chat?.id ?? null;
        setActiveConversationTitle(
          conversation.displayName || conversation.email || `User ${conversation.id}`
        );
      } else {
        // Group chats use one thread per group and include member labels.
        const [chatPayload, membersPayload] = await Promise.all([
          apiFetch(`/groups/${conversation.id}/chat`),
          apiFetch(`/groups/${conversation.id}/members`),
        ]);
        const members = Array.isArray(membersPayload?.members)
          ? membersPayload.members
          : [];
        const namesByUserId = {};
        for (const member of members) {
          const memberId = Number(member.id);
          if (!Number.isInteger(memberId) || memberId <= 0) continue;
          namesByUserId[memberId] =
            member.display_name || member.email || `User ${memberId}`;
        }
        setGroupMemberNames(namesByUserId);

        const payload = chatPayload;
        resolvedChatId = payload?.chat?.id ?? null;
        const groupName = payload?.group?.name || conversation.name;
        setActiveConversationTitle(groupName || `Group ${conversation.id}`);
      }

      if (!Number.isInteger(resolvedChatId) || resolvedChatId <= 0) {
        throw new Error('Failed to initialize chat thread.');
      }

      setChatId(resolvedChatId);
      const loadedMessages = await loadMessages(resolvedChatId, activeUserId);
      setMessages(loadedMessages);
      setUiState(loadedMessages.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      setUiState('error');
      setErrorMessage(error.message || 'Unexpected error');
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setLoadingConversations(true);
      try {
        const profilePayload = await apiFetch('/profile/me');
        const meId = profilePayload?.user?.id;
        if (!Number.isInteger(meId) || meId <= 0) {
          throw new Error('Unable to resolve your account for chat.');
        }

        const [matchesPayload, groupsPayload] = await Promise.all([
          apiFetch('/matches?page=1&limit=100'),
          apiFetch('/groups'),
        ]);
        if (cancelled) return;

        const directRows = Array.isArray(matchesPayload?.items)
          ? matchesPayload.items.map((item) => ({
              type: 'direct',
              id: item.user_id,
              displayName: item.display_name || item.email || `User ${item.user_id}`,
              email: item.email || '',
            }))
          : [];

        const groupRows = Array.isArray(groupsPayload?.groups)
          ? groupsPayload.groups.map((group) => ({
              type: 'group',
              id: Number(group.id),
              name: group.name || `Group ${group.id}`,
              status: group.status || 'forming',
            }))
          : [];

        setCurrentUserId(meId);
        setDirectConversations(directRows);
        setGroupConversations(groupRows);

        let initial = null;
        // URL params can deep-link into a conversation; otherwise default first available.
        if (preselectedGroup) {
          initial =
            groupRows.find((group) => Number(group.id) === preselectedGroup) || null;
        }
        if (!initial && preselectedRecipient) {
          initial =
            directRows.find((direct) => Number(direct.id) === preselectedRecipient) ||
            null;
        }
        if (!initial) {
          initial = directRows[0] || groupRows[0] || null;
        }
        setSelectedConversation(initial);
      } catch (error) {
        if (cancelled) return;
        setUiState('error');
        setErrorMessage(error.message || 'Failed to load conversations.');
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [preselectedGroup, preselectedRecipient]);

  useEffect(() => {
    if (loadingConversations) return;
    if (!currentUserId || !selectedConversation) {
      if (!loadingConversations) {
        setUiState('empty');
      }
      return;
    }
    openConversation(currentUserId, selectedConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, loadingConversations, selectedConversation]);

  useEffect(() => {
    if (!chatId || !currentUserId || uiState === 'error') {
      return undefined;
    }
    const timer = window.setInterval(async () => {
      try {
        const latest = await loadMessages(chatId, currentUserId);
        setMessages((existing) => {
          if (
            existing.length === latest.length &&
            existing[existing.length - 1]?.id === latest[latest.length - 1]?.id
          ) {
            return existing;
          }
          return latest;
        });
        if (latest.length > 0) {
          setUiState('ready');
        }
      } catch {
        // Keep current state on transient polling failures.
      }
      // Polling keeps chat usable without websocket infrastructure.
    }, 3000);
    return () => window.clearInterval(timer);
  }, [chatId, currentUserId, uiState]);

  async function handleSend(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isInputDisabled || !chatId) return;

    try {
      const payload = await apiFetch(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: {
          sender_user_id: currentUserId,
          body,
        },
      });
      setMessages((current) => [
        ...current,
        {
          id: payload.message.id,
          senderUserId: Number(payload.message.sender_user_id),
          text: payload.message.body,
          timestamp: payload.message.created_at,
        },
      ]);
      setUiState('ready');
      setDraft('');
    } catch (error) {
      setUiState('error');
      setErrorMessage(error.message || 'Unexpected error');
    }
  }

  function renderConversationState() {
    if (loadingConversations || uiState === 'loading') {
      return (
        <div className="grid min-h-[260px] place-content-center justify-items-center gap-3 p-8 text-center text-[#100e06]/70">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#881c1c]/20 border-t-[#881c1c]" />
          <p className="text-sm font-medium">Loading conversation…</p>
        </div>
      );
    }

    if (uiState === 'error') {
      return (
        <div className="grid min-h-[260px] place-content-center justify-items-center gap-4 p-8 text-center">
          <p className="max-w-md text-sm text-[#7a0019]">{errorMessage}</p>
          <button
            type="button"
            className={btnPrimaryClass}
            onClick={() => {
              if (currentUserId && selectedConversation) {
                openConversation(currentUserId, selectedConversation);
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
        <div className="grid min-h-[260px] place-content-center justify-items-center gap-2 p-8 text-center text-[#100e06]/70">
          <p className="font-medium text-[#100e06]">No messages yet.</p>
          <span className="text-sm">Send the first message to start this chat.</span>
        </div>
      );
    }

    return (
      <ul className="grid list-none gap-2.5 p-4">
        {visibleMessages.map((message) => {
          const isMe = Number(message.senderUserId) === Number(currentUserId);
          const senderLabel =
            selectedConversation?.type === 'group'
              ? isMe
                ? 'You'
                : groupMemberNames[Number(message.senderUserId)] ||
                  `User ${message.senderUserId}`
              : null;
          return (
            <li key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <article
                className={`grid max-w-[min(76%,560px)] gap-1.5 rounded-2xl px-3 py-2.5 ${
                  isMe
                    ? 'rounded-br-md bg-gradient-to-br from-[#7a0019] to-[#881c1c] text-white'
                    : 'rounded-bl-md border border-[#881c1c]/10 bg-white/70 text-[#100e06] backdrop-blur-sm'
                }`}
              >
                {senderLabel ? (
                  <p
                    className={`m-0 text-[0.72rem] font-semibold ${
                      isMe ? 'text-white/85' : 'text-[#100e06]/65'
                    }`}
                  >
                    {senderLabel}
                  </p>
                ) : null}
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
    <div className="mx-auto flex w-full max-w-6xl py-2">
      <section className="grid h-[min(780px,calc(100vh-8rem))] w-full grid-cols-[290px_1fr] overflow-hidden rounded-3xl border border-[#881c1c]/12 bg-white/60 shadow-xl shadow-[#7a0019]/10 backdrop-blur-xl">
        <aside className="border-r border-[#881c1c]/12 bg-white/55 p-4">
          <h1 className="mb-4 text-lg font-bold text-[#100e06]">Chats</h1>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a0019]/80">
              Direct chats
            </h2>
            <div className="grid gap-2">
              {directConversations.length === 0 ? (
                <p className="rounded-xl border border-[#881c1c]/10 bg-white/70 px-3 py-2 text-xs text-[#100e06]/60">
                  No direct chats yet
                </p>
              ) : (
                directConversations.map((item) => {
                  const active =
                    selectedConversation?.type === 'direct' &&
                    selectedConversation?.id === item.id;
                  return (
                    <button
                      key={`direct-${item.id}`}
                      type="button"
                      onClick={() => setSelectedConversation(item)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-transparent bg-[#881c1c] text-white shadow-md shadow-[#7a0019]/25'
                          : 'border-[#881c1c]/15 bg-white/80 text-[#100e06] hover:border-[#881c1c]/30'
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.displayName}</p>
                      <p className={`text-xs ${active ? 'text-white/85' : 'text-[#100e06]/65'}`}>
                        {item.email || `User ${item.id}`}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a0019]/80">
              Group chats
            </h2>
            <div className="grid gap-2">
              {groupConversations.length === 0 ? (
                <p className="rounded-xl border border-[#881c1c]/10 bg-white/70 px-3 py-2 text-xs text-[#100e06]/60">
                  No groups yet
                </p>
              ) : (
                groupConversations.map((item) => {
                  const active =
                    selectedConversation?.type === 'group' &&
                    selectedConversation?.id === item.id;
                  return (
                    <button
                      key={`group-${item.id}`}
                      type="button"
                      onClick={() => setSelectedConversation(item)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-transparent bg-[#881c1c] text-white shadow-md shadow-[#7a0019]/25'
                          : 'border-[#881c1c]/15 bg-white/80 text-[#100e06] hover:border-[#881c1c]/30'
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className={`text-xs ${active ? 'text-white/85' : 'text-[#100e06]/65'}`}>
                        Status: {formatGroupStatus(item.status)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="border-b border-[#881c1c]/10 px-5 py-4">
            <h2 className="text-lg font-bold text-[#100e06]">RoomMatch Chat</h2>
            <p className="mt-1 text-sm text-[#100e06]/60">
              {selectedConversation
                ? `${selectedConversation.type === 'group' ? 'Group' : 'Direct'} chat: ${activeConversationTitle || 'Connecting…'}`
                : 'Select a conversation from the left'}
            </p>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto">{renderConversationState()}</section>

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
      </section>
    </div>
  );
}
