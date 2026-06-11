import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type RecordGroupDefinition,
  RecordGroupDefinitionType,
} from '@/object-record/record-group/types/RecordGroupDefinition';
import { ALL_GROUPABLE_FIELD_TYPES } from '@/object-record/record-group/constants/GroupableFieldTypes';
import { getGroupOptionsForField } from '@/object-record/record-group/utils/getGroupOptionsForField';
import { type ViewGroup } from '@/views/types/ViewGroup';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from 'twenty-shared/types';

export const mapViewGroupsToRecordGroupDefinitions = ({
  mainGroupByFieldMetadataId,
  objectMetadataItem,
  viewGroups,
}: {
  mainGroupByFieldMetadataId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewGroups: ViewGroup[];
}): RecordGroupDefinition[] => {
  if (viewGroups?.length === 0) {
    return [];
  }

  const groupFieldMetadataItem = objectMetadataItem.fields.find(
    (field) =>
      field.id === mainGroupByFieldMetadataId &&
      ALL_GROUPABLE_FIELD_TYPES.includes(field.type),
  );

  if (!groupFieldMetadataItem) {
    return [];
  }

  const groupOptions = getGroupOptionsForField(groupFieldMetadataItem);

  const isStaticField = [
    FieldMetadataType.SELECT,
    FieldMetadataType.MULTI_SELECT,
    FieldMetadataType.BOOLEAN,
    FieldMetadataType.RATING,
  ].includes(groupFieldMetadataItem.type as FieldMetadataType);

  const recordGroupDefinitionsFromViewGroups = viewGroups
    .map((viewGroup) => {
      let fieldValue = viewGroup.fieldValue;
      if (
        (groupFieldMetadataItem.type === FieldMetadataType.DATE ||
          groupFieldMetadataItem.type === FieldMetadataType.DATE_TIME) &&
        typeof fieldValue === 'string' &&
        fieldValue.length === 7
      ) {
        fieldValue = `${fieldValue}-01`;
      }

      const selectedOption = groupOptions.find(
        (option) => option.value === fieldValue,
      );

      if (
        isStaticField &&
        !selectedOption &&
        isDefined(viewGroup.fieldValue) &&
        viewGroup.fieldValue !== ''
      ) {
        return null;
      }

      if (
        isStaticField &&
        !selectedOption &&
        groupFieldMetadataItem.isNullable === false
      ) {
        return null;
      }

      return {
        id: viewGroup.id,
        type:
          !isDefined(selectedOption) &&
          (viewGroup.fieldValue === '' || !isDefined(viewGroup.fieldValue))
            ? RecordGroupDefinitionType.NoValue
            : RecordGroupDefinitionType.Value,
        title: selectedOption?.label ?? (viewGroup.fieldValue || 'No Value'),
        value: selectedOption?.value ?? (viewGroup.fieldValue === '' ? null : (viewGroup.fieldValue ?? null)),
        color: selectedOption?.color ?? 'transparent',
        position: viewGroup.position,
        isVisible: viewGroup.isVisible,
      } as RecordGroupDefinition;
    })
    .filter(isDefined);

  return recordGroupDefinitionsFromViewGroups.sort(
    (a, b) => a.position - b.position,
  );
};

