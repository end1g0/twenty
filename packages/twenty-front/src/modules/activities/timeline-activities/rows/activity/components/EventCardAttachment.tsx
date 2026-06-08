import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { getSafeUrl, isDefined } from 'twenty-shared/utils';
import { FileIcon } from '@/file/components/FileIcon';
import { getFileCategoryFromExtension } from '@/object-record/record-field/ui/utils/getFileCategoryFromExtension';
import { getFileNameAndExtension } from '~/utils/file/getFileNameAndExtension';
import { formatToHumanReadableDate } from '~/utils/date-utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledLink = styled.a`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &:hover {
    color: ${themeCssVariables.font.color.secondary};
    text-decoration: underline;
  }
`;

const StyledDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  white-space: nowrap;
`;

interface Attachment {
  id: string;
  name: string;
  file: {
    url: string;
    label: string;
    extension: string;
    fileId: string;
  };
  createdAt: string;
}

export const EventCardAttachment = ({ attachmentId }: { attachmentId: string }) => {
  const { t } = useLingui();

  const { record: attachment, loading } = useFindOneRecord<Attachment>({
    objectNameSingular: CoreObjectNameSingular.Attachment,
    objectRecordId: attachmentId,
    recordGqlFields: {
      id: true,
      name: true,
      file: true,
      createdAt: true,
    },
  });

  if (loading || !isDefined(attachment)) {
    return <div>{t`Loading...`}</div>;
  }

  const { name: fileName, extension } = getFileNameAndExtension(
    attachment.file?.label || attachment.name || ''
  );
  const fileCategory = getFileCategoryFromExtension(attachment.file?.extension || extension);
  const fileUrl = attachment.file?.url || '';

  return (
    <StyledContainer>
      <FileIcon fileCategory={fileCategory} />
      <StyledLink href={getSafeUrl(fileUrl)} target="_blank" rel="noopener noreferrer">
        {attachment.file?.label || attachment.name || t`Untitled`}
      </StyledLink>
      <StyledDate>
        {formatToHumanReadableDate(attachment.createdAt)}
      </StyledDate>
    </StyledContainer>
  );
};
