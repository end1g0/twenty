import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { RECORD_BOARD_QUERY_PAGE_SIZE } from '@/object-record/record-board/constants/RecordBoardQueryPageSize';
import { useSetRecordIdsForColumn } from '@/object-record/record-board/hooks/useSetRecordIdsForColumn';
import { lastRecordBoardQueryIdentifierComponentState } from '@/object-record/record-board/states/lastRecordBoardQueryIdentifierComponentState';
import { recordBoardCurrentGroupByQueryOffsetComponentState } from '@/object-record/record-board/states/recordBoardCurrentGroupByQueryOffsetComponentState';
import { recordBoardShouldFetchMoreInColumnComponentFamilyState } from '@/object-record/record-board/states/recordBoardShouldFetchMoreInColumnComponentFamilyState';
import { recordGroupDefinitionsComponentSelector } from '@/object-record/record-group/states/selectors/recordGroupDefinitionsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexGroupCommonQueryVariables } from '@/object-record/record-index/hooks/useRecordIndexGroupCommonQueryVariables';
import { useRecordIndexGroupsRecordsLazyGroupBy } from '@/object-record/record-index/hooks/useRecordIndexGroupsRecordsLazyGroupBy';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';
import { recordIndexRecordGroupsAreInInitialLoadingComponentState } from '@/object-record/record-index/states/recordIndexRecordGroupsAreInInitialLoadingComponentState';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { getQueryIdentifier } from '@/object-record/utils/getQueryIdentifier';
import { getGroupByQueryResultGqlFieldName } from '@/page-layout/utils/getGroupByQueryResultGqlFieldName';
import { useScrollWrapperHTMLElement } from '@/ui/utilities/scroll/hooks/useScrollWrapperHTMLElement';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { isNonEmptyArray } from '@sniptt/guards';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from 'twenty-shared/types';
import { v4 } from 'uuid';
import {
  type RecordGroupDefinition,
  RecordGroupDefinitionType,
} from '@/object-record/record-group/types/RecordGroupDefinition';
import { useSetRecordGroups } from '@/object-record/record-group/hooks/useSetRecordGroups';


export const useTriggerRecordBoardInitialQuery = () => {
  const recordGroupDefinitions = useAtomComponentSelectorValue(
    recordGroupDefinitionsComponentSelector,
  );

  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();

  const { setRecordGroups } = useSetRecordGroups();

  const recordIndexGroupFieldMetadataItem = useAtomComponentStateValue(
    recordIndexGroupFieldMetadataItemComponentState,
  );

  const isDateField = recordIndexGroupFieldMetadataItem &&
    (recordIndexGroupFieldMetadataItem.type === FieldMetadataType.DATE ||
      recordIndexGroupFieldMetadataItem.type === FieldMetadataType.DATE_TIME);

  const setLastRecordBoardQueryIdentifier = useSetAtomComponentState(
    lastRecordBoardQueryIdentifierComponentState,
  );

  const recordBoardShouldFetchMoreInColumnFamilyCallbackState =
    useAtomComponentFamilyStateCallbackState(
      recordBoardShouldFetchMoreInColumnComponentFamilyState,
    );

  const recordIndexRecordGroupsAreInInitialLoading =
    useAtomComponentStateCallbackState(
      recordIndexRecordGroupsAreInInitialLoadingComponentState,
    );

  const store = useStore();

  const setRecordBoardCurrentGroupByQueryOffset = useSetAtomComponentState(
    recordBoardCurrentGroupByQueryOffsetComponentState,
  );

  const { combinedFilters, orderBy } =
    useRecordIndexGroupCommonQueryVariables();

  const queryIdentifier = getQueryIdentifier({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: combinedFilters,
    orderBy,
  });

  const { setRecordIdsForColumn } = useSetRecordIdsForColumn();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const { scrollWrapperHTMLElement } = useScrollWrapperHTMLElement();

  const { executeRecordIndexGroupsRecordsLazyGroupBy } =
    useRecordIndexGroupsRecordsLazyGroupBy({
      groupByFieldMetadataItem: recordIndexGroupFieldMetadataItem,
      objectMetadataItem,
    });

  const triggerRecordBoardInitialQuery = useCallback(async () => {
    store.set(recordIndexRecordGroupsAreInInitialLoading, true);

    const cleanStateBeforeExit = () => {
      store.set(recordIndexRecordGroupsAreInInitialLoading, false);

      setLastRecordBoardQueryIdentifier(queryIdentifier);

      setRecordBoardCurrentGroupByQueryOffset(0);

      scrollWrapperHTMLElement?.scrollTo({ top: 0, left: 0 });
    };

    const recordIndexGroupsRecordsGroupByLazyQueryResult =
      await executeRecordIndexGroupsRecordsLazyGroupBy();

    if (!isDefined(recordIndexGroupsRecordsGroupByLazyQueryResult)) {
      cleanStateBeforeExit();

      return;
    }

    const queryFieldName =
      getGroupByQueryResultGqlFieldName(objectMetadataItem);

    const groups =
      recordIndexGroupsRecordsGroupByLazyQueryResult.data?.[queryFieldName];

    if (!isDefined(groups)) {
      cleanStateBeforeExit();

      return;
    }

    const currentGroupValues = new Set(
      recordGroupDefinitions.map((def) => def.value),
    );

    const MONTH_NAMES = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const newGroupsToCreate: RecordGroupDefinition[] = [];
    if (isDefined(groups)) {
      for (const group of groups) {
        let value = group.groupByDimensionValues[0] ?? null;
        if (isDefined(value)) {
          value = String(value);
        }
        if (isDateField && typeof value === 'string' && value.length >= 10) {
          value = value.substring(0, 10);
        }
        if (!currentGroupValues.has(value) && value !== null && value !== '') {
          let title = value;
          if (
            recordIndexGroupFieldMetadataItem &&
            (recordIndexGroupFieldMetadataItem.type === FieldMetadataType.DATE ||
              recordIndexGroupFieldMetadataItem.type === FieldMetadataType.DATE_TIME)
          ) {
            const parts = value.split('-');
            if (parts.length >= 2) {
              const year = parts[0];
              const monthIndex = parseInt(parts[1], 10) - 1;
              if (monthIndex >= 0 && monthIndex < 12) {
                title = `${MONTH_NAMES[monthIndex]} ${year}`;
              }
            }
          }
          if (
            recordIndexGroupFieldMetadataItem &&
            recordIndexGroupFieldMetadataItem.type === FieldMetadataType.CURRENCY
          ) {
            const amount = parseFloat(value) / 1000000;
            if (!isNaN(amount)) {
              title = `$${amount.toLocaleString()}`;
            }
          }
          newGroupsToCreate.push({
            id: v4(),
            type: RecordGroupDefinitionType.Value,
            title: title,
            value: value,
            color: 'transparent',
            position: recordGroupDefinitions.length + newGroupsToCreate.length,
            isVisible: true,
          });
        }
      }
    }

    const activeDefinitions = newGroupsToCreate.length > 0
      ? [...recordGroupDefinitions, ...newGroupsToCreate]
      : recordGroupDefinitions;

    const filteredDefinitions = isDateField
      ? activeDefinitions.filter((def) => {
          return groups.some((group: any) => {
            let value = group.groupByDimensionValues[0] ?? null;
            if (isDateField && typeof value === 'string' && value.length >= 10) {
              value = value.substring(0, 10);
            }
            return value === def.value;
          });
        })
      : activeDefinitions;

    const shouldUpdateRecordGroups = newGroupsToCreate.length > 0 || isDateField;

    if (shouldUpdateRecordGroups) {
      setRecordGroups({
        mainGroupByFieldMetadataId: recordIndexGroupFieldMetadataItem?.id ?? '',
        recordGroups: filteredDefinitions,
        recordIndexId,
        objectMetadataItemId: objectMetadataItem.id,
      });
    }

    const definitionsToProcess = shouldUpdateRecordGroups ? filteredDefinitions : recordGroupDefinitions;

    for (const recordGroupDefinition of definitionsToProcess) {
      const foundGroupInResult = groups?.find((recordGroup: any) => {
        let value = recordGroup.groupByDimensionValues[0];
        if (isDefined(value)) {
          value = String(value);
        }
        if (isDateField && typeof value === 'string' && value.length >= 10) {
          value = value.substring(0, 10);
        }
        return value === recordGroupDefinition.value;
      });

      if (!isDefined(foundGroupInResult)) {
        setRecordIdsForColumn(recordGroupDefinition.id, []);
        store.set(
          recordBoardShouldFetchMoreInColumnFamilyCallbackState(
            recordGroupDefinition.id,
          ),
          false,
        );
        continue;
      }

      const records = getRecordsFromRecordConnection({
        recordConnection: foundGroupInResult,
      });

      if (!isNonEmptyArray(records)) {
        setRecordIdsForColumn(recordGroupDefinition.id, []);
        store.set(
          recordBoardShouldFetchMoreInColumnFamilyCallbackState(
            recordGroupDefinition.id,
          ),
          false,
        );
        continue;
      }

      upsertRecordsInStore({ partialRecords: records });

      setRecordIdsForColumn(recordGroupDefinition.id, records);

      if (records.length < RECORD_BOARD_QUERY_PAGE_SIZE) {
        store.set(
          recordBoardShouldFetchMoreInColumnFamilyCallbackState(
            recordGroupDefinition.id,
          ),
          false,
        );
      } else {
        store.set(
          recordBoardShouldFetchMoreInColumnFamilyCallbackState(
            recordGroupDefinition.id,
          ),
          true,
        );
      }
    }

    cleanStateBeforeExit();
  }, [
    recordIndexRecordGroupsAreInInitialLoading,
    store,
    executeRecordIndexGroupsRecordsLazyGroupBy,
    objectMetadataItem,
    setLastRecordBoardQueryIdentifier,
    queryIdentifier,
    setRecordBoardCurrentGroupByQueryOffset,
    scrollWrapperHTMLElement,
    recordGroupDefinitions,
    upsertRecordsInStore,
    setRecordIdsForColumn,
    recordBoardShouldFetchMoreInColumnFamilyCallbackState,
    setRecordGroups,
    recordIndexId,
    recordIndexGroupFieldMetadataItem,
  ]);

  return {
    triggerRecordBoardInitialQuery,
  };
};
