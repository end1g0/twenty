import { randomUUID } from 'node:crypto';

import { type gmail_v1 } from 'googleapis';
import { http, HttpResponse, type RequestHandler } from 'msw';

import { setupHttpMock } from 'test/integration/utils/http-mock';

export const INVALID_REFRESH_TOKEN_PREFIX = 'invalid-refresh-token';

const GOOGLE_OAUTH_SCOPES = [
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/profile.emails.read',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
].join(' ');

export const gmailMessage = (
  overrides: Partial<gmail_v1.Schema$Message> = {},
): gmail_v1.Schema$Message => {
  const id = overrides.id ?? `gmail-msg-${randomUUID()}`;

  return {
    id,
    threadId: id,
    historyId: '987654321',
    internalDate: '1700000000000',
    labelIds: ['INBOX'],
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'To', value: 'recipient@example.com' },
        { name: 'Subject', value: `Subject ${id}` },
        { name: 'Message-ID', value: `<${id}@example.com>` },
        { name: 'Date', value: 'Wed, 15 Nov 2023 00:00:00 +0000' },
      ],
      body: {
        data: Buffer.from(`body ${id}`).toString('base64'),
        size: 10,
      },
    },
    ...overrides,
  };
};

export const getGmailMessageSubject = (
  message: gmail_v1.Schema$Message,
): string =>
  message.payload?.headers?.find((header) => header.name === 'Subject')
    ?.value ?? '';

const DEFAULT_LABELS: gmail_v1.Schema$Label[] = [
  { id: 'INBOX', name: 'INBOX', type: 'system' },
  { id: 'SENT', name: 'SENT', type: 'system' },
];

export type GmailLabelStore = {
  add: (label: gmail_v1.Schema$Label) => void;
  remove: (labelId: string) => void;
  reset: () => void;
  list: () => gmail_v1.Schema$Label[];
};

const createGmailLabelStore = (
  initialLabels: gmail_v1.Schema$Label[],
): GmailLabelStore => {
  let labels = [...initialLabels];

  return {
    add: (label) => {
      labels = [...labels, label];
    },
    remove: (labelId) => {
      labels = labels.filter((label) => label.id !== labelId);
    },
    reset: () => {
      labels = [...initialLabels];
    },
    list: () => labels,
  };
};

const buildBatchMultipartResponse = (
  inbox: gmail_v1.Schema$Message[],
): { body: string; contentType: string } => {
  const boundary = 'batch_boundary';
  const subResponses = inbox
    .map((message) =>
      [
        `--${boundary}`,
        'Content-Type: application/http',
        '',
        'HTTP/1.1 200 OK',
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(message),
      ].join('\r\n'),
    )
    .join('\r\n');

  return {
    body: `${subResponses}\r\n--${boundary}--`,
    contentType: `multipart/mixed; boundary=${boundary}`,
  };
};

const gmailHandlers = ({
  inbox,
  labelStore,
  handle,
}: {
  inbox: gmail_v1.Schema$Message[];
  labelStore: GmailLabelStore;
  handle: string;
}): RequestHandler[] => [
  http.post('https://oauth2.googleapis.com/token', async ({ request }) => {
    const body = new URLSearchParams(await request.text());

    if (
      (body.get('refresh_token') ?? '').startsWith(INVALID_REFRESH_TOKEN_PREFIX)
    ) {
      return HttpResponse.json(
        { error: 'invalid_grant', error_description: 'Token has been revoked' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      access_token: 'mock-access-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      token_type: 'Bearer',
    });
  }),
  // --- OAuth connect flow (passport code exchange + connect-path availability checks) ---
  http.post('https://www.googleapis.com/oauth2/v4/token', () =>
    HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      scope: GOOGLE_OAUTH_SCOPES,
      token_type: 'Bearer',
    }),
  ),
  http.get('https://www.googleapis.com/oauth2/v3/userinfo', () =>
    HttpResponse.json({
      sub: 'google-user-id',
      email: handle,
      email_verified: true,
      name: 'Jane Austen',
      given_name: 'Jane',
      family_name: 'Austen',
    }),
  ),
  http.get('https://www.googleapis.com/oauth2/v3/tokeninfo', () =>
    HttpResponse.json({ scope: GOOGLE_OAUTH_SCOPES, email: handle }),
  ),
  http.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', () =>
    HttpResponse.json({ emailAddress: handle, messagesTotal: 0 }),
  ),
  http.get(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    () => HttpResponse.json({ items: [] }),
  ),
  http.get('*/gmail/v1/users/me/settings/sendAs', () => {
    const sendAs: gmail_v1.Schema$SendAs[] = [
      { sendAsEmail: handle, isPrimary: true },
    ];

    return HttpResponse.json<gmail_v1.Schema$ListSendAsResponse>({ sendAs });
  }),
  http.get('*/gmail/v1/users/me/labels', () =>
    HttpResponse.json<gmail_v1.Schema$ListLabelsResponse>({
      labels: labelStore.list(),
    }),
  ),
  http.get('*/gmail/v1/users/me/messages', () => {
    const messages: gmail_v1.Schema$Message[] = inbox.map((message) => ({
      id: message.id,
      threadId: message.threadId,
    }));

    return HttpResponse.json<gmail_v1.Schema$ListMessagesResponse>({
      messages,
      resultSizeEstimate: inbox.length,
    });
  }),
  http.get('*/gmail/v1/users/me/messages/:messageId', ({ params }) =>
    HttpResponse.json<gmail_v1.Schema$Message>({
      id: String(params.messageId),
      threadId: String(params.messageId),
      historyId: inbox[0]?.historyId ?? '987654321',
    }),
  ),
  http.post('*/batch', () => {
    const { body, contentType } = buildBatchMultipartResponse(inbox);

    return new HttpResponse(body, { headers: { 'Content-Type': contentType } });
  }),
];

export const setupGmailMock = ({
  inbox,
  labels = DEFAULT_LABELS,
  handle = 'me@example.com',
}: {
  inbox: gmail_v1.Schema$Message[];
  labels?: gmail_v1.Schema$Label[];
  handle?: string;
}): { labels: GmailLabelStore; use: (...handlers: unknown[]) => void } => {
  const labelStore = createGmailLabelStore(labels);

  const httpMock = setupHttpMock(
    ...gmailHandlers({ inbox, labelStore, handle }),
  );

  return { labels: labelStore, use: httpMock.use };
};
