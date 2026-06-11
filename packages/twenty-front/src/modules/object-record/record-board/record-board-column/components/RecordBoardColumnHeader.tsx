import { styled } from '@linaria/react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldMetadataType } from 'twenty-shared/types';
import { isFieldFullNameValue } from '@/object-record/record-field/ui/types/guards/isFieldFullNameValue';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { allRecordIdsOfAllRecordGroupsComponentSelector } from '@/object-record/record-index/states/selectors/allRecordIdsOfAllRecordGroupsComponentSelector';
import { recordStoreRecordsSelector } from '@/object-record/record-store/states/selectors/recordStoreRecordsSelector';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { RecordBoardColumnDropdownMenu } from '@/object-record/record-board/record-board-column/components/RecordBoardColumnDropdownMenu';
import { RecordBoardColumnHeaderAggregateDropdown } from '@/object-record/record-board/record-board-column/components/RecordBoardColumnHeaderAggregateDropdown';

import { RECORD_BOARD_COLUMN_WIDTH } from '@/object-record/record-board/constants/RecordBoardColumnWidth';
import { RecordBoardColumnContext } from '@/object-record/record-board/record-board-column/contexts/RecordBoardColumnContext';
import { hasAnySoftDeleteFilterOnViewComponentSelector } from '@/object-record/record-filter/states/hasAnySoftDeleteFilterOnView';
import { RecordGroupDefinitionType } from '@/object-record/record-group/types/RecordGroupDefinition';
import { recordIndexAggregateDisplayLabelComponentState } from '@/object-record/record-index/states/recordIndexAggregateDisplayLabelComponentState';
import { recordIndexAggregateDisplayValueForGroupValueComponentFamilyState } from '@/object-record/record-index/states/recordIndexAggregateDisplayValueForGroupValueComponentFamilyState';
import { useCreateNewIndexRecord } from '@/object-record/record-table/hooks/useCreateNewIndexRecord';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { useAtomComponentFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateValue';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { Tag } from 'twenty-ui-deprecated/components';
import { IconDotsVertical, IconPlus } from 'twenty-ui-deprecated/display';
import { LightIconButton } from 'twenty-ui-deprecated/input';

const StyledHeader = styled.div`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  height: 100%;
  justify-content: left;
  width: 100%;
`;

const StyledHeaderActions = styled.div`
  display: flex;
  margin-left: auto;
`;

const StyledHeaderContainer = styled.div`
  background: ${themeCssVariables.background.primary};
  display: flex;
  justify-content: space-between;
  width: 100%;
`;
const StyledLeftContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  overflow: hidden;
`;

const StyledRightContainer = styled.div`
  align-items: center;
  display: flex;
`;

const StyledColumn = styled.div`
  background-color: ${themeCssVariables.background.primary};
  display: flex;
  flex-direction: column;
  max-width: ${RECORD_BOARD_COLUMN_WIDTH}px;
  min-width: ${RECORD_BOARD_COLUMN_WIDTH}px;

  padding: ${themeCssVariables.spacing[2]};

  position: relative;
`;

const StyledTagContainer = styled.div`
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
`;

const StyledDropdownContainer = styled.div`
  min-width: 0;
  overflow: hidden;
`;

export const RecordBoardColumnHeader = () => {
  const { columnDefinition } = useContext(RecordBoardColumnContext);

  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const { objectMetadataItem, selectFieldMetadataItem } =
    useContext(RecordBoardContext);

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const hasObjectUpdatePermissions = objectPermissions.canUpdateObjectRecords;

  const hasAnySoftDeleteFilterOnView = useAtomComponentSelectorValue(
    hasAnySoftDeleteFilterOnViewComponentSelector,
  );

  const { createNewIndexRecord } = useCreateNewIndexRecord({
    objectMetadataItem: objectMetadataItem,
  });

  const recordIndexAggregateDisplayValueForGroupValue =
    useAtomComponentFamilyStateValue(
      recordIndexAggregateDisplayValueForGroupValueComponentFamilyState,
      { groupValue: columnDefinition?.value ?? '' },
    );

  const recordIndexAggregateDisplayLabel = useAtomComponentStateValue(
    recordIndexAggregateDisplayLabelComponentState,
  );

  const { toggleDropdown } = useToggleDropdown();

  const dropdownId = `record-board-column-dropdown-${columnDefinition.id}`;

  const allRecordIds = useAtomComponentSelectorValue(
    allRecordIdsOfAllRecordGroupsComponentSelector,
  );

  const allRecords = useAtomFamilySelectorValue(
    recordStoreRecordsSelector,
    { recordIds: allRecordIds },
  );

  const displayTitle = useMemo(() => {
    if (columnDefinition.type === RecordGroupDefinitionType.NoValue) {
      return columnDefinition.title;
    }

    if (selectFieldMetadataItem?.type === FieldMetadataType.RELATION) {
      const matchedRecord = allRecords.find((record) => {
        const relationId =
          record[`${selectFieldMetadataItem.name}Id`] ??
          record[selectFieldMetadataItem.name]?.id;
        return relationId === columnDefinition.value;
      });

      const relationValue = matchedRecord?.[selectFieldMetadataItem.name];

      if (relationValue) {
        if (isFieldFullNameValue(relationValue.name)) {
          return `${relationValue.name.firstName} ${relationValue.name.lastName}`;
        }
        return (
          relationValue.name ?? relationValue.label ?? columnDefinition.title
        );
      }
    }

    return columnDefinition.title;
  }, [columnDefinition, selectFieldMetadataItem, allRecords]);

  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (displayTitle && displayTitle !== columnDefinition.title) {
      setResolvedTitle(displayTitle);
    }
  }, [displayTitle, columnDefinition.title]);

  const headerTitle = resolvedTitle ?? displayTitle;

  const handleCreateNewRecordClick = async () => {
    if (!selectFieldMetadataItem) {
      return;
    }
    await createNewIndexRecord({
      position: 'first',
      [selectFieldMetadataItem.name]: columnDefinition.value,
    });
  };

  return (
    <StyledColumn>
      <StyledHeader
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <StyledHeaderContainer>
          <StyledLeftContainer>
            <StyledDropdownContainer>
              <Dropdown
                dropdownId={dropdownId}
                dropdownPlacement="bottom-start"
                dropdownOffset={{
                  x: 0,
                  y: 10,
                }}
                clickableComponent={
                  <StyledTagContainer>
                    <Tag
                      variant={
                        columnDefinition.type ===
                        RecordGroupDefinitionType.Value
                          ? 'solid'
                          : 'outline'
                      }
                      color={
                        columnDefinition.type ===
                        RecordGroupDefinitionType.Value
                          ? columnDefinition.color
                          : 'transparent'
                      }
                      text={headerTitle}
                      weight={
                        columnDefinition.type ===
                        RecordGroupDefinitionType.Value
                          ? 'regular'
                          : 'medium'
                      }
                    />
                  </StyledTagContainer>
                }
                dropdownComponents={<RecordBoardColumnDropdownMenu />}
              />
            </StyledDropdownContainer>

            <RecordBoardColumnHeaderAggregateDropdown
              aggregateValue={recordIndexAggregateDisplayValueForGroupValue}
              dropdownId={`record-board-column-aggregate-dropdown-${columnDefinition.id}`}
              objectMetadataItem={objectMetadataItem}
              aggregateLabel={recordIndexAggregateDisplayLabel}
            />
          </StyledLeftContainer>
          <StyledRightContainer>
            {isHeaderHovered && (
              <StyledHeaderActions>
                <LightIconButton
                  accent="tertiary"
                  Icon={IconDotsVertical}
                  onClick={() => {
                    toggleDropdown({
                      dropdownComponentInstanceIdFromProps: dropdownId,
                    });
                  }}
                />
                {hasObjectUpdatePermissions &&
                  !hasAnySoftDeleteFilterOnView && (
                    <LightIconButton
                      accent="tertiary"
                      Icon={IconPlus}
                      onClick={handleCreateNewRecordClick}
                    />
                  )}
              </StyledHeaderActions>
            )}
          </StyledRightContainer>
        </StyledHeaderContainer>
      </StyledHeader>
    </StyledColumn>
  );
};
