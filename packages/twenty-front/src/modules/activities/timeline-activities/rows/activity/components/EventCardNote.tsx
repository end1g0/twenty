import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type Note } from '@/activities/types/Note';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { getActivityPreview } from '@/activities/utils/getActivityPreview';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &:hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledBody = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
`;

export const EventCardNote = ({ noteId }: { noteId: string }) => {
  const { t } = useLingui();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const { record: note, loading } = useFindOneRecord<Note>({
    objectNameSingular: CoreObjectNameSingular.Note,
    objectRecordId: noteId,
    recordGqlFields: {
      id: true,
      title: true,
      bodyV2: {
        blocknote: true,
      },
    },
  });

  if (loading || !isDefined(note)) {
    return <div>{t`Loading...`}</div>;
  }

  const body = getActivityPreview(note?.bodyV2?.blocknote ?? null);

  return (
    <StyledContainer>
      <StyledTitle onClick={() => openRecordInSidePanel({ recordId: note.id, objectNameSingular: CoreObjectNameSingular.Note })}>
        {note.title || t`Untitled`}
      </StyledTitle>
      {body && <StyledBody>{body}</StyledBody>}
    </StyledContainer>
  );
};
