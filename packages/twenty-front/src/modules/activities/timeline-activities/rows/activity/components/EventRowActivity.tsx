import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';

import { type EventRowDynamicComponentProps } from '@/activities/timeline-activities/rows/components/EventRowDynamicComponent.types';
import { EventRowItem } from '@/activities/timeline-activities/rows/components/EventRowItem';
import { isTimelineActivityWithLinkedRecord } from '@/activities/timeline-activities/types/TimelineActivity';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useGetRecordFromCache } from '@/object-record/cache/hooks/useGetRecordFromCache';
import { isNonEmptyString } from '@sniptt/guards';
import { OverflowingTextWithTooltip } from 'twenty-ui/display';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';
import { EventCard } from '@/activities/timeline-activities/rows/components/EventCard';
import { EventCardTask } from './EventCardTask';
import { EventCardNote } from './EventCardNote';
import { EventCardAttachment } from './EventCardAttachment';

type EventRowActivityProps = EventRowDynamicComponentProps;

const StyledLinkedActivity = styled.span`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  overflow: hidden;
  text-decoration: underline;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const StyledRowContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
`;

const StyledEventRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  overflow: hidden;
`;

const StyledRightContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledItemTitleDate = styled.div`
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    display: none;
  }
  color: ${themeCssVariables.font.color.tertiary};
  padding: 0 ${themeCssVariables.spacing[1]};
`;

export const StyledEventRowItemText = styled.span`
  color: ${themeCssVariables.font.color.primary};
`;

export const EventRowActivity = ({
  event,
  authorFullName,
  objectNameSingular,
  createdAt,
}: EventRowActivityProps & { objectNameSingular: CoreObjectNameSingular }) => {
  const [eventLinkedObject, eventAction] = event.name.split('.');

  const eventObject = eventLinkedObject.replace('linked-', '');

  const getActivityFromCache = useGetRecordFromCache({
    objectNameSingular,
    recordGqlFields: {
      id: true,
      title: true,
    },
  });

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const hasLinkedRecord = isTimelineActivityWithLinkedRecord(event);

  const activityInStore = hasLinkedRecord
    ? getActivityFromCache(event.linkedRecordId)
    : null;

  const computeActivityTitle = () => {
    if (isNonEmptyString(activityInStore?.title)) {
      return activityInStore?.title;
    }

    if (isNonEmptyString(event.linkedRecordCachedName)) {
      return event.linkedRecordCachedName;
    }

    return t`Untitled`;
  };
  const activityTitle = computeActivityTitle();

  return (
    <StyledEventRow>
      <StyledRowContainer>
        <StyledRow>
          <EventRowItem>{authorFullName}</EventRowItem>
          <EventRowItem variant="action">
            {t`${eventAction} a related ${eventObject}`}
          </EventRowItem>
          {hasLinkedRecord && (
            <StyledLinkedActivity
              onClick={() =>
                openRecordInSidePanel({
                  recordId: event.linkedRecordId,
                  objectNameSingular,
                })
              }
            >
              <OverflowingTextWithTooltip text={activityTitle} />
            </StyledLinkedActivity>
          )}
          {!hasLinkedRecord && (
            <StyledLinkedActivity as="span" style={{ cursor: 'default', textDecoration: 'none' }}>
              <OverflowingTextWithTooltip text={activityTitle} />
            </StyledLinkedActivity>
          )}
        </StyledRow>
        <StyledRightContainer>
          <StyledItemTitleDate>{createdAt}</StyledItemTitleDate>
        </StyledRightContainer>
      </StyledRowContainer>
      {hasLinkedRecord && (
        <EventCard isOpen={true}>
          {objectNameSingular === CoreObjectNameSingular.Task && (
            <EventCardTask taskId={event.linkedRecordId} />
          )}
          {objectNameSingular === CoreObjectNameSingular.Note && (
            <EventCardNote noteId={event.linkedRecordId} />
          )}
          {objectNameSingular === CoreObjectNameSingular.Attachment && (
            <EventCardAttachment attachmentId={event.linkedRecordId} />
          )}
        </EventCard>
      )}
    </StyledEventRow>
  );
};
