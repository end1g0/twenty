import { MessageChannelSyncStage } from 'twenty-shared/types';

import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { MessagingOngoingStaleJob } from 'src/modules/messaging/message-import-manager/jobs/messaging-ongoing-stale.job';
import { queryMessageChannel } from 'test/integration/messaging/utils/query-messaging.util';
import { seedMessageChannel } from 'test/integration/messaging/utils/seed-message-channel.util';
import { enqueueJobAndAwait } from 'test/integration/utils/enqueue-job-and-await.util';
import { pollUntil } from 'test/integration/utils/poll-until.util';

const WORKSPACE_ID = SEED_APPLE_WORKSPACE_ID;

const STALE_STARTED_AT = new Date(Date.now() - 31 * 60 * 1000);
const RECENT_STARTED_AT = new Date(Date.now() - 60 * 1000);

describe('Messaging stale-sync recovery (integration)', () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  it('resets stale ongoing channels to pending and leaves recent ones running', async () => {
    const staleListFetch = await seedMessageChannel({
      workspaceId: WORKSPACE_ID,
      syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_ONGOING,
      syncStageStartedAt: STALE_STARTED_AT,
    });
    const staleImport = await seedMessageChannel({
      workspaceId: WORKSPACE_ID,
      syncStage: MessageChannelSyncStage.MESSAGES_IMPORT_ONGOING,
      syncStageStartedAt: STALE_STARTED_AT,
    });
    const recentListFetch = await seedMessageChannel({
      workspaceId: WORKSPACE_ID,
      syncStage: MessageChannelSyncStage.MESSAGE_LIST_FETCH_ONGOING,
      syncStageStartedAt: RECENT_STARTED_AT,
    });

    try {
      await enqueueJobAndAwait(
        MessageQueue.messagingQueue,
        MessagingOngoingStaleJob,
        { workspaceId: WORKSPACE_ID },
      );

      const staleListFetchAfter = await pollUntil(
        () =>
          queryMessageChannel(
            staleListFetch.connectedAccountId,
            staleListFetch.channelId,
          ),
        (channelState) =>
          channelState.syncStage ===
          MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
        { timeoutMs: 30_000 },
      );
      expect(staleListFetchAfter.syncStage).toBe(
        MessageChannelSyncStage.MESSAGE_LIST_FETCH_PENDING,
      );
      expect(staleListFetchAfter.syncStageStartedAt).toBeNull();

      const staleImportAfter = await queryMessageChannel(
        staleImport.connectedAccountId,
        staleImport.channelId,
      );
      expect(staleImportAfter.syncStage).toBe(
        MessageChannelSyncStage.MESSAGES_IMPORT_PENDING,
      );
      expect(staleImportAfter.syncStageStartedAt).toBeNull();

      const recentListFetchAfter = await queryMessageChannel(
        recentListFetch.connectedAccountId,
        recentListFetch.channelId,
      );
      expect(recentListFetchAfter.syncStage).toBe(
        MessageChannelSyncStage.MESSAGE_LIST_FETCH_ONGOING,
      );
    } finally {
      await staleListFetch.cleanup();
      await staleImport.cleanup();
      await recentListFetch.cleanup();
    }
  }, 60000);
});
