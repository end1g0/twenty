import { isNull } from '@sniptt/guards';
import { FieldMetadataType, type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RecordGroupDefinition } from '@/object-record/record-group/types/RecordGroupDefinition';

export const computeRecordGroupOptionsFilter = ({
  recordGroupFieldMetadata,
  recordGroupValues,
}: {
  recordGroupFieldMetadata: FieldMetadataItem | null | undefined;
  recordGroupValues: RecordGroupDefinition['value'][];
}): RecordGqlOperationFilter => {
  if (!isDefined(recordGroupFieldMetadata) || recordGroupValues.length === 0) {
    return {};
  }

  if (
    recordGroupFieldMetadata.type === FieldMetadataType.DATE ||
    recordGroupFieldMetadata.type === FieldMetadataType.DATE_TIME
  ) {
    return {};
  }

  const fieldName =
    recordGroupFieldMetadata.type === FieldMetadataType.RELATION
      ? `${recordGroupFieldMetadata.name}Id`
      : recordGroupFieldMetadata.name;
  const hasNullValue = recordGroupValues.some(isNull);
  const nonNullValues = recordGroupValues.filter(
    (value): value is NonNullable<typeof value> => !isNull(value),
  );

  if (recordGroupFieldMetadata.type === FieldMetadataType.BOOLEAN) {
    const booleanFilters = nonNullValues.map((val) => ({
      [fieldName]: { eq: val === 'true' },
    }));

    if (hasNullValue) {
      return booleanFilters.length > 0
        ? {
            or: [
              { [fieldName]: { is: 'NULL' } },
              ...booleanFilters,
            ],
          }
        : { [fieldName]: { is: 'NULL' } };
    }

    if (booleanFilters.length === 1) {
      return booleanFilters[0];
    }

    if (booleanFilters.length > 1) {
      return {
        or: booleanFilters,
      };
    }

    return {};
  }

  return hasNullValue
    ? {
        or: [
          { [fieldName]: { is: 'NULL' } },
          ...(nonNullValues.length > 0
            ? [{ [fieldName]: { in: nonNullValues } }]
            : []),
        ],
      }
    : nonNullValues.length > 0
      ? {
          [fieldName]: { in: recordGroupValues },
        }
      : {};
};
