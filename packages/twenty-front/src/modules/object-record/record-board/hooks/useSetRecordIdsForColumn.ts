import { useCallback } from 'react';
import { useStore } from 'jotai';

import { emptyRecordGroupByIdComponentFamilyState } from '@/object-record/record-group/states/emptyRecordGroupByIdComponentFamilyState';
import { recordGroupDefinitionFamilyState } from '@/object-record/record-group/states/recordGroupDefinitionFamilyState';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';
import { recordIndexRecordIdsByGroupComponentFamilyState } from '@/object-record/record-index/states/recordIndexRecordIdsByGroupComponentFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { isDefined } from 'twenty-shared/utils';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';
import { FieldMetadataType } from 'twenty-shared/types';

export const useSetRecordIdsForColumn = (recordBoardId?: string) => {
  const store = useStore();

  const recordGroupFieldMetadata = useAtomComponentStateCallbackState(
    recordIndexGroupFieldMetadataItemComponentState,
    recordBoardId,
  );

  const recordIndexRecordIdsByGroupFamilyState =
    useAtomComponentFamilyStateCallbackState(
      recordIndexRecordIdsByGroupComponentFamilyState,
      recordBoardId,
    );

  const emptyRecordGroupByIdCallbackState =
    useAtomComponentFamilyStateCallbackState(
      emptyRecordGroupByIdComponentFamilyState,
    );

  const setRecordIdsForColumn = useCallback(
    (currentRecordGroupId: string, records: ObjectRecord[]) => {
      const recordGroup = store.get(
        recordGroupDefinitionFamilyState.atomFamily(currentRecordGroupId),
      );

      const existingRecordGroupRowIds = store.get(
        recordIndexRecordIdsByGroupFamilyState(currentRecordGroupId),
      );

      const currentRecordGroupFieldMetadata = store.get(
        recordGroupFieldMetadata,
      );

      if (!isDefined(currentRecordGroupFieldMetadata)) {
        return;
      }

      const getRecordGroupFieldValue = (record: ObjectRecord) => {
        if (
          currentRecordGroupFieldMetadata.type === FieldMetadataType.RELATION
        ) {
          return (
            record[`${currentRecordGroupFieldMetadata.name}Id`] ??
            record[currentRecordGroupFieldMetadata.name]?.id ??
            null
          );
        }
        const rawValue = record[currentRecordGroupFieldMetadata.name];
        if (
          (currentRecordGroupFieldMetadata.type === FieldMetadataType.DATE ||
            currentRecordGroupFieldMetadata.type === FieldMetadataType.DATE_TIME) &&
          typeof rawValue === 'string' &&
          rawValue.length >= 7
        ) {
          return `${rawValue.substring(0, 7)}-01`;
        }
        if (
          currentRecordGroupFieldMetadata.type === FieldMetadataType.CURRENCY &&
          isDefined(rawValue) &&
          typeof rawValue === 'object'
        ) {
          return isDefined((rawValue as any).amountMicros)
            ? String((rawValue as any).amountMicros)
            : null;
        }
        if (
          currentRecordGroupFieldMetadata.type === FieldMetadataType.EMAILS &&
          isDefined(rawValue) &&
          typeof rawValue === 'object'
        ) {
          return (rawValue as any).primaryEmail ?? null;
        }
        if (
          currentRecordGroupFieldMetadata.type === FieldMetadataType.PHONES &&
          isDefined(rawValue) &&
          typeof rawValue === 'object'
        ) {
          return (rawValue as any).primaryPhoneNumber ?? null;
        }
        if (
          currentRecordGroupFieldMetadata.type === FieldMetadataType.LINKS &&
          isDefined(rawValue) &&
          typeof rawValue === 'object'
        ) {
          return (rawValue as any).primaryLinkUrl ?? null;
        }
        if (
          (currentRecordGroupFieldMetadata.type === FieldMetadataType.BOOLEAN ||
            currentRecordGroupFieldMetadata.type === FieldMetadataType.NUMBER) &&
          isDefined(rawValue)
        ) {
          return String(rawValue);
        }
        return rawValue;
      };

      const recordGroupRowIds = records
        .filter(
          (record) => getRecordGroupFieldValue(record) === recordGroup?.value,
        )
        .map((record) => record.id);

      if (!isDeeplyEqual(existingRecordGroupRowIds, recordGroupRowIds)) {
        store.set(
          recordIndexRecordIdsByGroupFamilyState(currentRecordGroupId),
          recordGroupRowIds,
        );
      }

      const isEmptyRecordGroup = store.get(
        emptyRecordGroupByIdCallbackState(currentRecordGroupId),
      );

      const computedIsEmptyRecordGroup = recordGroupRowIds.length === 0;

      if (computedIsEmptyRecordGroup !== isEmptyRecordGroup) {
        store.set(
          emptyRecordGroupByIdCallbackState(currentRecordGroupId),
          computedIsEmptyRecordGroup,
        );
      }
    },
    [
      recordIndexRecordIdsByGroupFamilyState,
      recordGroupFieldMetadata,
      emptyRecordGroupByIdCallbackState,
      store,
    ],
  );

  return {
    setRecordIdsForColumn,
  };
};
