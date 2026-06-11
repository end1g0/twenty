import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const openNavigationMenuItemObjectIdsState = createAtomState<string[]>({
  key: 'openNavigationMenuItemObjectIdsState',
  defaultValue: [],
});
