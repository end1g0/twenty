import { ConnectedAccountProvider } from 'twenty-shared/types';

import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import {
  type MessagingMessageListFetchJobData,
  MessagingMessageListFetchJob,
  type MessagingMessageListFetchJobResult,
} from 'src/modules/messaging/message-import-manager/jobs/messaging-message-list-fetch.job';
import { setupMicrosoftMock } from 'test/integration/messaging/utils/microsoft-mock.util';
import { queryMessageFolders } from 'test/integration/messaging/utils/query-messaging.util';
import { seedMessageChannel } from 'test/integration/messaging/utils/seed-message-channel.util';
import { enqueueJobAndAwait } from 'test/integration/utils/enqueue-job-and-await.util';
import { pollUntil } from 'test/integration/utils/poll-until.util';

const WORKSPACE_ID = SEED_APPLE_WORKSPACE_ID;

describe('Microsoft folder discovery (integration)', () => {
  setupMicrosoftMock({ inbox: [] });

  let channel: Awaited<ReturnType<typeof seedMessageChannel>>;

  const getFolderNames = async (channelId: string): Promise<string[]> => {
    const folders = await queryMessageFolders(channelId);

    return folders
      .map((folder) => folder.name)
      .filter((name): name is string => name !== null)
      .sort();
  };

  beforeAll(async () => {
    jest.useRealTimers();
    channel = await seedMessageChannel({
      workspaceId: WORKSPACE_ID,
      provider: ConnectedAccountProvider.MICROSOFT,
    });
  }, 60000);

  afterAll(async () => {
    await channel.cleanup();
  });

  it('discovers Microsoft mail folders through the Graph delta sync', async () => {
    await enqueueJobAndAwait<
      MessagingMessageListFetchJobData,
      MessagingMessageListFetchJobResult
    >(MessageQueue.messagingQueue, MessagingMessageListFetchJob, {
      messageChannelId: channel.channelId,
      workspaceId: WORKSPACE_ID,
    });

    const folderNames = await pollUntil(
      () => getFolderNames(channel.channelId),
      (names) => names.length === 2,
      { timeoutMs: 30_000 },
    );

    expect(folderNames).toEqual(['Inbox', 'Sent Items']);
  }, 60000);
});
