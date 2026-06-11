import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { setTestObjectMetadataItemsInMetadataStore } from '~/testing/utils/setTestObjectMetadataItemsInMetadataStore';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';
import { viewObjectMetadataIdComponentState } from '@/views/states/viewObjectMetadataIdComponentState';
import { useGetAvailableFieldsToGroupRecordsBy } from '@/views/view-picker/hooks/useGetAvailableFieldsToGroupRecordsBy';
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const mockObjectMetadataId = 'test-object-id';
const mockViewInstanceId = 'test-view-instance-id';

const createMockObjectMetadataItem = (fields: any[]) => ({
  id: mockObjectMetadataId,
  namePlural: 'testObjects',
  nameSingular: 'testObject',
  readableFields: fields,
  fields,
});

const createWrapper = (objectMetadataItems: any[]) => {
  return ({ children }: { children: ReactNode }) => {
    setTestObjectMetadataItemsInMetadataStore(jotaiStore, objectMetadataItems);
    jotaiStore.set(
      viewObjectMetadataIdComponentState.atomFamily({
        instanceId: mockViewInstanceId,
      }),
      mockObjectMetadataId,
    );
    return (
      <JotaiProvider store={jotaiStore}>
        <MemoryRouter>
          <ViewComponentInstanceContext.Provider
            value={{ instanceId: mockViewInstanceId }}
          >
            {children}
          </ViewComponentInstanceContext.Provider>
        </MemoryRouter>
      </JotaiProvider>
    );
  };
};

describe('useGetAvailableFieldsToGroupRecordsBy', () => {
  it('should filter out inactive SELECT fields', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.SELECT,
        label: 'Active Status',
        isActive: true,
      },
      {
        id: '2',
        type: FieldMetadataType.SELECT,
        label: 'Inactive Status',
        isActive: false,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      {
        wrapper,
      },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(1);
    expect(result.current.availableFieldsForGrouping[0].label).toBe(
      'Active Status',
    );
  });

  it('should include BOOLEAN fields', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.BOOLEAN,
        label: 'Is Active',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      { wrapper },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(1);
    expect(result.current.availableFieldsForGrouping[0].type).toBe(
      FieldMetadataType.BOOLEAN,
    );
  });

  it('should include RATING fields', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.RATING,
        label: 'Priority',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      { wrapper },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(1);
    expect(result.current.availableFieldsForGrouping[0].type).toBe(
      FieldMetadataType.RATING,
    );
  });

  it('should include MULTI_SELECT fields', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.MULTI_SELECT,
        label: 'Tags',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      { wrapper },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(1);
    expect(result.current.availableFieldsForGrouping[0].type).toBe(
      FieldMetadataType.MULTI_SELECT,
    );
  });

  it('should include TEXT fields (dynamic grouping)', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.TEXT,
        label: 'Category',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      { wrapper },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(1);
    expect(result.current.availableFieldsForGrouping[0].type).toBe(
      FieldMetadataType.TEXT,
    );
  });

  it('should exclude non-groupable field types', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.RICH_TEXT,
        label: 'Description',
        isActive: true,
      },
      {
        id: '2',
        type: FieldMetadataType.UUID,
        label: 'Id',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      { wrapper },
    );

    expect(result.current.availableFieldsForGrouping).toHaveLength(0);
  });

  it('should return the navigateToSelectSettings function', () => {
    const fields = [
      {
        id: '1',
        type: FieldMetadataType.SELECT,
        label: 'Status',
        isActive: true,
      },
    ];

    const objectMetadataItems = [createMockObjectMetadataItem(fields)];
    const wrapper = createWrapper(objectMetadataItems);

    const { result } = renderHook(
      () => useGetAvailableFieldsToGroupRecordsBy(),
      {
        wrapper,
      },
    );

    expect(result.current.navigateToSelectSettings).toBeDefined();
    expect(typeof result.current.navigateToSelectSettings).toBe('function');
  });
});

