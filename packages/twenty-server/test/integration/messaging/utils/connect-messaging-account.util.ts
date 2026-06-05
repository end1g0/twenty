import gql from 'graphql-tag';
import request from 'supertest';
import { ConnectedAccountProvider } from 'twenty-shared/types';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';
import {
  deleteConnectedAccount,
  queryMessageChannels,
} from 'test/integration/messaging/utils/query-messaging.util';

type ConnectMessagingAccountResult = {
  channelId: string;
  connectedAccountId: string;
  cleanup: () => Promise<void>;
};

const OAUTH_CALLBACK_PATH: Partial<Record<ConnectedAccountProvider, string>> = {
  [ConnectedAccountProvider.GOOGLE]: '/auth/google-apis/get-access-token',
  [ConnectedAccountProvider.MICROSOFT]: '/auth/microsoft-apis/get-access-token',
};

// Connects a messaging account through the real OAuth callback the providers redirect to:
// mints a transient token for the authed user, drives the callback with a code (the HTTP
// boundary is mocked), and lets the provider's auth service create a fresh connected account
// and message channel. Returns the channel and a cleanup that removes the account through the
// same mutation the product uses.
export const connectMessagingAccount = async (
  provider: ConnectedAccountProvider,
): Promise<ConnectMessagingAccountResult> => {
  const callbackPath = OAUTH_CALLBACK_PATH[provider];

  if (!callbackPath) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const channelIdsBeforeConnect = new Set(
    (await queryMessageChannels()).map((channel) => channel.id),
  );

  const transientTokenResponse = await makeMetadataAPIRequest({
    query: gql`
      mutation GenerateTransientToken {
        generateTransientToken {
          transientToken {
            token
          }
        }
      }
    `,
  });

  const state = JSON.stringify({
    transientToken:
      transientTokenResponse.body.data.generateTransientToken.transientToken
        .token,
    messageVisibility: 'SHARE_EVERYTHING',
    skipMessageChannelConfiguration: true,
  });

  const callbackResponse = await request(`http://localhost:${APP_PORT}`)
    .get(callbackPath)
    .query({ code: 'mock-authorization-code', state });

  const connectedChannel = (await queryMessageChannels()).find(
    (channel) => !channelIdsBeforeConnect.has(channel.id),
  );

  if (!connectedChannel) {
    throw new Error(
      `OAuth connect for ${provider} created no message channel (callback redirected to ${callbackResponse.headers.location})`,
    );
  }

  return {
    channelId: connectedChannel.id,
    connectedAccountId: connectedChannel.connectedAccountId,
    cleanup: () => deleteConnectedAccount(connectedChannel.connectedAccountId),
  };
};
