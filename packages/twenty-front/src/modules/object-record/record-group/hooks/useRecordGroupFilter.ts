import { FieldMetadataType } from 'twenty-shared/types';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useCurrentRecordGroupDefinition } from '@/object-record/record-group/hooks/useCurrentRecordGroupDefinition';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { coerceGroupValueForFieldType } from '@/object-record/record-group/utils/coerceGroupValueForFieldType';

export const useRecordGroupFilter = (fields: FieldMetadataItem[]) => {
  const currentRecordGroupDefinition = useCurrentRecordGroupDefinition();
  const recordIndexGroupFieldMetadataItem = useAtomComponentStateValue(
    recordIndexGroupFieldMetadataItemComponentState,
  );

  const recordGroupFilter = useMemo(() => {
    if (isDefined(currentRecordGroupDefinition)) {
      const fieldMetadataItem = fields.find(
        (fieldMetadataItem) =>
          fieldMetadataItem.id === recordIndexGroupFieldMetadataItem?.id,
      );

      if (!fieldMetadataItem) {
        throw new Error(
          `Field metadata item with id ${recordIndexGroupFieldMetadataItem?.id} not found`,
        );
      }

      const filterFieldName =
        fieldMetadataItem.type === FieldMetadataType.RELATION
          ? `${fieldMetadataItem.name}Id`
          : fieldMetadataItem.name;

      if (!isDefined(currentRecordGroupDefinition.value)) {
        return { [filterFieldName]: { is: 'NULL' } };
      }

      const coercedValue = coerceGroupValueForFieldType(
        fieldMetadataItem.type,
        currentRecordGroupDefinition.value,
      );

      return {
        [filterFieldName]: {
          eq: coercedValue,
        },
      };
    }

    return {};
  }, [
    currentRecordGroupDefinition,
    fields,
    recordIndexGroupFieldMetadataItem?.id,
  ]);

  return { recordGroupFilter };
};
