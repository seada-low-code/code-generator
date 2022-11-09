import type { NodeSchema, CompositeObject } from '@alilc/lowcode-types';
import type { TComponentAnalyzer } from '../types';

import { handleSubNodes } from '../utils/schema';

/**
 * 组件分析器，主要是判断是否有使用ref
 * @param container 容器schema
 * @returns
 */
export const componentAnalyzer: TComponentAnalyzer = (container) => {
  const refArr: string[] = [];
  let hasRefAttr = false;
  const nodeValidator = (n: NodeSchema) => {
    if (n.props) {
      const props = n.props as CompositeObject;
      if (props.ref) {
        refArr.push(props.ref as string);
        hasRefAttr = true;
      }
    }
  };

  nodeValidator(container);

  if (container.children) {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    handleSubNodes<void>(
      container.children,
      {
        node: nodeValidator,
      },
      {
        rerun: true,
      },
    );
  }

  return {
    isUsingRef: hasRefAttr,
    refArr,
  };
};
