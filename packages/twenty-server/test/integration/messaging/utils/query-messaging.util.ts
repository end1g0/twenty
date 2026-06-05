// TODO: cleanup see if we can reuse fragments from frontend
import gql from 'graphql-tag';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';

export type MessageFolderDto = {
  id: string;
  name: string | null;
  isSynced: boolean;
};

export type MessageChannelDto = {
  id: string;
  connectedAccountId: string;
  syncStatus: string;
  syncStage: string;
  syncStageStartedAt: string | null;
  throttleFailureCount: number;
  throttleRetryAfter: string | null;
};

const MESSAGE_CHANNEL_FIELDS = gql`
  fragment TestMessageChannelFields on MessageChannel {
    id
    connectedAccountId
    syncStatus
    syncStage
    syncStageStartedAt
    throttleFailureCount
    throttleRetryAfter
  }
`;

export const queryMessageChannels = async (): Promise<MessageChannelDto[]> => {
  const response = await makeMetadataAPIRequest({
    query: gql`
      query MessageChannelsForTest {
        myMessageChannels {
          ...TestMessageChannelFields
        }
      }
      ${MESSAGE_CHANNEL_FIELDS}
    `,
  });

  return response.body.data.myMessageChannels;
};

export const deleteConnectedAccount = async (
  connectedAccountId: string,
): Promise<void> => {
  await makeMetadataAPIRequest({
    query: gql`
      mutation DeleteConnectedAccountForTest($id: UUID!) {
        deleteConnectedAccount(id: $id) {
          id
        }
      }
    `,
    variables: { id: connectedAccountId },
  });
};

export const queryMessageFolders = async (
  messageChannelId: string,
): Promise<MessageFolderDto[]> => {
  const response = await makeMetadataAPIRequest({
    query: gql`
      query MessageFoldersForTest($messageChannelId: UUID) {
        myMessageFolders(messageChannelId: $messageChannelId) {
          id
          name
          isSynced
        }
      }
    `,
    variables: { messageChannelId },
  });

  return response.body.data.myMessageFolders;
};

export const queryMessageChannel = async (
  connectedAccountId: string,
  messageChannelId: string,
): Promise<MessageChannelDto> => {
  const response = await makeMetadataAPIRequest({
    query: gql`
      query MessageChannelForTest($connectedAccountId: UUID) {
        myMessageChannels(connectedAccountId: $connectedAccountId) {
          ...TestMessageChannelFields
        }
      }
      ${MESSAGE_CHANNEL_FIELDS}
    `,
    variables: { connectedAccountId },
  });

  const channel = response.body.data.myMessageChannels.find(
    (candidate: MessageChannelDto) => candidate.id === messageChannelId,
  );

  if (!channel) {
    throw new Error(`Message channel ${messageChannelId} not found`);
  }

  return channel;
};
