import type { ComponentProps } from 'react';
import { Diagram } from './lesson/Diagram';
import { SmartLink } from './SmartLink';

export function TableWrap(props: ComponentProps<'table'>) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Table (scrolls sideways on small screens)">
      <table {...props} />
    </div>
  );
}

/** Components for plain markdown (exercise text, model answers, the reference design). */
export const mdComponents = {
  a: SmartLink,
  table: TableWrap,
  'mermaid-diagram': ({ code }: { code: string }) => <Diagram code={code} />,
};
