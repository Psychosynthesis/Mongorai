import type { OptionType } from '@Commn/types';

export type SelectProps = {
  options: OptionType[];
  placeholder?: string;
  selectedIndex: number | null;
  currentIndexSetter: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
  listStyle?: React.CSSProperties;
  nonScrolledItems?: number;
}
