import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type Task } from '@/activities/types/Task';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Checkbox, CheckboxShape } from 'twenty-ui/input';
import { useCompleteTask } from '@/activities/tasks/hooks/useCompleteTask';
import { getActivitySummary } from '@/activities/utils/getActivitySummary';
import { IconCalendar } from 'twenty-ui/display';
import { beautifyExactDate, hasDatePassed } from '~/utils/date-utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const StyledTitle = styled.span<{ completed: boolean }>`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-decoration: ${({ completed }) => (completed ? 'line-through' : 'none')};
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

const StyledFooter = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const EMPTY_TASK: Task = {
  id: '',
  title: '',
  bodyV2: null,
  status: null,
  dueAt: null,
  assignee: null,
  assigneeId: null,
  taskTargets: [],
  body: '',
  createdAt: '',
  updatedAt: '',
  __typename: 'Task',
} as unknown as Task;

export const EventCardTask = ({ taskId }: { taskId: string }) => {
  const { t } = useLingui();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  
  const { record: task, loading } = useFindOneRecord<Task>({
    objectNameSingular: CoreObjectNameSingular.Task,
    objectRecordId: taskId,
    recordGqlFields: {
      id: true,
      title: true,
      bodyV2: {
        blocknote: true,
      },
      status: true,
      dueAt: true,
    },
  });

  const taskForHook = isDefined(task) ? task : EMPTY_TASK;
  const { completeTask } = useCompleteTask(taskForHook);

  if (loading || !isDefined(task)) {
    return <div>{t`Loading...`}</div>;
  }

  const body = getActivitySummary(task?.bodyV2?.blocknote ?? null);
  const isPast = task.dueAt ? hasDatePassed(task.dueAt) && task.status === 'TODO' : false;

  return (
    <StyledContainer>
      <StyledHeader>
        <Checkbox
          checked={task.status === 'DONE'}
          shape={CheckboxShape.Rounded}
          onCheckedChange={completeTask}
        />
        <StyledTitle 
          completed={task.status === 'DONE'}
          onClick={() => openRecordInSidePanel({ recordId: task.id, objectNameSingular: CoreObjectNameSingular.Task })}
        >
          {task.title || t`Untitled`}
        </StyledTitle>
      </StyledHeader>
      {body && <StyledBody>{body}</StyledBody>}
      {task.dueAt && (
        <StyledFooter>
          <IconCalendar size={14} color={isPast ? themeCssVariables.font.color.danger : undefined} />
          <span style={{ color: isPast ? themeCssVariables.font.color.danger : undefined }}>
            {beautifyExactDate(task.dueAt)}
          </span>
        </StyledFooter>
      )}
    </StyledContainer>
  );
};
